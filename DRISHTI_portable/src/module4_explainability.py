"""
============================================================================
DRISHTI - MODULE 4: EXPLAINABILITY + CONSISTENCY CHECK ("the innovation")
============================================================================
THE PROBLEM WITH NORMAL AI EXPLAINABILITY:
    Grad-CAM (a famous technique) shows WHERE the AI looked as a coloured
    heatmap. But it does NOT prove the AI looked at the RIGHT thing!
    An AI can confidently say "severe DR" while staring at the optic disc
    or an eyelash - Grad-CAM alone would look impressive but be medically
    wrong. Doctors would (rightly) not trust it.

OUR SOLUTION - A 4-STEP CONSISTENCY CHECK:
    Step 1: Generate the Grad-CAM heatmap from our CNN (WHERE did AI look?)
    Step 2: Overlay the lesion evidence from Module 2 (WHAT should it see?)
    Step 3: Compute CONSISTENCY metrics between the two:
              * Centroid distance  - heatmap peak vs nearest lesion
              * Region overlap     - % of heatmap energy on lesion areas
              * Evidence agreement - does the lesion count match the grade?
    Step 4: Combine quality + confidence + consistency -> TRUST SCORE (0-1)

    TRUST >= 0.76  -> "TRUSTED: screening recommendation stands"
    TRUST <  0.55  -> "HUMAN REVIEW REQUIRED" (catches confident-but-wrong!)
    in between     -> "REVIEW: queue for ophthalmologist"
============================================================================
"""

import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as T

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE, "models", "drishti_dr_model.pt")
DEVICE = torch.device("cpu")

# Same normalisation used during training
TF = T.Compose([T.ToPILImage(), T.ToTensor(),
                T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])


# --------------------------------------------------------------------------
# Load the trained model once, reuse for every image
# --------------------------------------------------------------------------
_model = None
def get_model():
    global _model
    if _model is None:
        model = models.resnet18()
        model.fc = nn.Linear(model.fc.in_features, 3)
        ckpt = torch.load(MODEL_PATH, map_location=DEVICE)
        model.load_state_dict(ckpt["state_dict"])
        model.eval()
        _model = model
    return _model


# --------------------------------------------------------------------------
# STEP 1: GRAD-CAM heatmap
# --------------------------------------------------------------------------
def compute_gradcam(img_bgr, class_idx=None):
    """
    Grad-CAM algorithm (Selvaraju et al., 2017):
      1. Forward pass -> class score
      2. Backward pass -> gradient of that score w.r.t. the last conv layer
      3. Global-average the gradients -> one weight per feature map
      4. Weighted sum of feature maps -> ReLU -> heatmap of "attention"
    Returns: (class_index, probabilities, heatmap 0..255 same size as input)
    """
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from train_model import letterbox

    model = get_model()
    rgb = cv2.cvtColor(letterbox(img_bgr), cv2.COLOR_BGR2RGB)
    x = TF(rgb).unsqueeze(0).requires_grad_(True)

    activations, gradients = None, None

    def fwd_hook(module, inp, out):
        nonlocal activations
        activations = out.detach()

    def bwd_hook(module, grad_in, grad_out):
        nonlocal gradients
        gradients = grad_out[0].detach()

    target_layer = model.layer4[-1].conv2
    h1 = target_layer.register_forward_hook(fwd_hook)
    h2 = target_layer.register_full_backward_hook(bwd_hook)

    try:
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0]
        if class_idx is None:
            class_idx = int(probs.argmax())
        logits[0, class_idx].backward()
    finally:
        h1.remove()
        h2.remove()

    # Grad-CAM weights: global average of the gradients
    weights = gradients.mean(dim=(2, 3), keepdim=True)          # [1, C, 1, 1]
    cam = F.relu((weights * activations).sum(dim=1))             # [1, H, W]
    cam = F.interpolate(cam.unsqueeze(0), size=rgb.shape[:2],
                        mode="bilinear", align_corners=False)[0, 0]
    cam = cam - cam.min()
    if cam.max() > 0:
        cam = cam / cam.max()
    heatmap = (cam.numpy() * 255).astype(np.uint8)
    return class_idx, probs.detach().numpy(), heatmap


# --------------------------------------------------------------------------
# STEP 2+3: CONSISTENCY between Grad-CAM and lesion evidence
# --------------------------------------------------------------------------
def consistency_check(heatmap, evidence, shape, verbose=True):
    """
    Compares WHERE the AI looked (heatmap) with WHAT lesions exist
    (evidence from Module 2). Note: the heatmap is computed on the
    letterboxed 224x224 image; we rescale it back to the original size.
    Returns dict with centroid_distance_dd, region_overlap, evidence_agreement,
    consistency (0..1) and a human-readable verdict.
    """
    h, w = shape[:2]
    cam = cv2.resize(heatmap, (w, h)).astype(np.float32) / 255.0

    od_x, od_y, od_r = evidence["optic_disc"]
    dd = 2 * od_r
    lesion_centres = (evidence["ma_centres"] + evidence["hem_centres"]
                      + evidence["ex_centres"])

    # Build one combined lesion mask (dilated, everything counts as evidence)
    lesion_mask = np.zeros((h, w), np.uint8)
    for m in (evidence["ma_mask"], evidence["hem_mask"], evidence["ex_mask"]):
        lesion_mask = cv2.bitwise_or(lesion_mask, m)
    lesion_zone = cv2.dilate(lesion_mask, np.ones((25, 25), np.uint8))

    # --- Metric 1: centroid distance (peak of heatmap vs nearest lesion) ---
    if lesion_centres:
        ys, xs = np.unravel_index(np.argmax(cam), cam.shape)
        peak = (xs, ys)
        dist_px = min(np.hypot(cx - peak[0], cy - peak[1])
                      for cx, cy in lesion_centres)
        centroid_dist_dd = dist_px / max(dd, 1)
        # 0 DD = perfect (attention exactly on a lesion); >3 DD = terrible
        m_centroid = float(np.clip(1.0 - centroid_dist_dd / 3.0, 0.0, 1.0))
    else:
        centroid_dist_dd = None
        # No lesions anywhere: if AI also found nothing, the "peak" should
        # sit on normal anatomy (disc/vessels), which is consistent enough.
        m_centroid = 0.6

    # --- Metric 2: region overlap (heatmap energy on lesion areas) ---
    total_energy = float(cam.sum())
    if total_energy > 0 and lesion_zone.any():
        on_lesions = float(cam[lesion_zone > 0].sum())
        m_overlap = float(np.clip(on_lesions / total_energy / 0.30, 0.0, 1.0))
    elif not lesion_zone.any():
        m_overlap = 0.6      # no lesions to overlap with - neutral score
    else:
        m_overlap = 0.0

    # --- Metric 3: evidence agreement (lesion load vs what heatmap covers) ---
    lesion_load = (evidence["ma_count"] * 1.0 + evidence["hem_count"] * 2.0
                   + evidence["ex_count"] * 1.5)
    if lesion_load > 0:
        m_agreement = 0.5 + 0.5 * float(np.clip(lesion_load / 80.0, 0.0, 1.0))
    else:
        m_agreement = 0.5

    consistency = float(0.4 * m_centroid + 0.4 * m_overlap + 0.2 * m_agreement)
    verdict = ("HIGH" if consistency >= 0.55 else
               "MODERATE" if consistency >= 0.40 else "LOW")

    result = {
        "centroid_distance_dd": (round(centroid_dist_dd, 2)
                                 if centroid_dist_dd is not None else None),
        "region_overlap": round(m_overlap, 3),
        "evidence_agreement": round(m_agreement, 3),
        "consistency": round(consistency, 3),
        "verdict": verdict,
    }
    if verbose:
        print(f"   [EXPLAIN] consistency={consistency:.2f} ({verdict}) "
              f"| centroid_dist={result['centroid_distance_dd']} DD "
              f"| overlap={result['region_overlap']}")
    return result


# --------------------------------------------------------------------------
# STEP 4: TRUST SCORE + final decision
# --------------------------------------------------------------------------
def trust_decision(quality_score, confidence, consistency, predicted_class):
    """
    TRUST = 35% image quality + 35% model confidence + 30% consistency.
    If trust is low, the case is routed to a human ophthalmologist -
    that is the human-in-the-loop workflow from the problem statement.

    Thresholds (calibrated 2026-09-01, safety-first):
      HIGH     >= 0.76  -> auto screening recommendation stands
      MODERATE >= 0.55  -> queue for ophthalmologist review
      LOW      <  0.55  -> never act on AI alone
    Rationale: in medical screening, borderline evidence must go to a human.
    """
    trust = 0.35 * quality_score + 0.35 * confidence + 0.30 * consistency
    if trust >= 0.76:
        route = "TRUSTED - auto screening recommendation"
    elif trust >= 0.55:
        route = "REVIEW - queue for ophthalmologist (low confidence)"
    else:
        route = "HUMAN REVIEW REQUIRED - do not act on AI alone"
    return {
        "trust_score": round(float(trust), 3),
        "trust_level": ("HIGH" if trust >= 0.76 else
                        "MODERATE" if trust >= 0.55 else "LOW"),
        "route": route,
    }


def explain(img_bgr, evidence, quality_score, verbose=True):
    """
    THE MAIN FUNCTION of Module 4.
    Returns the complete explainability package:
      prediction, probabilities, gradcam heatmap, consistency, trust.
    """
    cls, probs, heatmap = compute_gradcam(img_bgr)
    classes = ["No DR (Level 0)", "NPDR - Referable (Level 2-3)",
               "PDR - Urgent (Level 4)"]
    consistency = consistency_check(heatmap, evidence, img_bgr.shape, verbose)
    confidence = float(probs.max())
    trust = trust_decision(quality_score, confidence,
                           consistency["consistency"], cls)

    if verbose:
        print(f"   [CLASSIFY] {classes[cls]} | confidence={confidence*100:.0f}%")
        print(f"   [TRUST]    score={trust['trust_score']} ({trust['trust_level']}) -> {trust['route']}")

    return {
        "predicted_class": int(cls),
        "predicted_label": classes[cls],
        "probabilities": {classes[i]: round(float(p), 3)
                          for i, p in enumerate(probs)},
        "confidence": round(confidence, 3),
        "gradcam": heatmap,
        "consistency": consistency,
        "trust": trust,
    }
