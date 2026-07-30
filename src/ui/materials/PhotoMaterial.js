export class PhotoMaterial {
  apply(photoFrame, memoryProgress = 0) {
    const progress = Math.max(0, Math.min(100, Number(memoryProgress) || 0));
    photoFrame.classList.add("photo-material");
    photoFrame.style.setProperty("--memory-progress", String(progress / 100));
    photoFrame.style.setProperty("--photo-sepia", String(.6 - progress * .0046));
    photoFrame.style.setProperty(
      "--photo-saturation",
      String(.45 + progress * .005),
    );
    photoFrame.style.setProperty(
      "--photo-contrast",
      String(.82 + progress * .0014),
    );
    photoFrame.style.setProperty(
      "--photo-brightness",
      String(.8 + progress * .002),
    );
    const grayscale =
      progress < 30
        ? 1 - progress / 120
        : progress < 70
          ? (70 - progress) / 53.333
          : 0;
    photoFrame.style.setProperty(
      "--photo-grayscale",
      String(Math.max(0, Math.min(1, grayscale))),
    );
    photoFrame.style.setProperty(
      "--photo-age-opacity",
      String(.56 - progress * .0026),
    );
    photoFrame.dataset.memoryBand =
      progress < 30 ? "forgotten" : progress < 70 ? "recovering" : "complete";
    return this;
  }
}
