const CONDITIONS = {
  anemia: {
    title: "Anemia",
    emoji: "🩸",
    symptoms: [
      "Unusual tiredness or weakness",
      "Pale skin, lips, or nails",
      "Shortness of breath",
      "Dizziness or lightheadedness",
      "Fast or irregular heartbeat",
      "Headaches",
      "Cold hands and feet"
    ],
    note: "Very common in pregnancy because blood volume increases. Usually picked up through routine blood tests — mention any of these to your doctor at your next visit."
  },
  bp: {
    title: "High blood pressure / preeclampsia",
    emoji: "💢",
    symptoms: [
      "Severe or persistent headache",
      "Vision changes — blurring, flashing, or spots",
      "Swelling in the face or hands, or sudden puffiness",
      "Sudden weight gain over a few days",
      "Upper abdominal pain, usually on the right side",
      "Nausea or vomiting later in pregnancy",
      "Little or no urine output"
    ],
    note: "⚠ These can signal preeclampsia, which needs urgent medical attention. If you notice these, contact your doctor or hospital right away — don't wait it out.",
    urgent: true
  },
  gd: {
    title: "Gestational diabetes",
    emoji: "🧪",
    symptoms: [
      "Often no noticeable symptoms at all",
      "Increased thirst",
      "Frequent urination beyond the usual",
      "Unusual fatigue",
      "Blurred vision",
      "Frequent infections, such as UTIs"
    ],
    note: "Because it's often silent, doctors screen for it with a glucose test around week 24–28, regardless of whether you have symptoms."
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".condition-btn");
  const detailBox = document.getElementById("conditionDetail");
  if (!buttons.length || !detailBox) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const key = btn.getAttribute("data-condition");
      const data = CONDITIONS[key];
      if (!data) return;

      const symptomsHtml = data.symptoms
        .map((s) => `<li>${s}</li>`)
        .join("");

      detailBox.innerHTML = `
        <h3 style="margin:0 0 10px;">${data.emoji} ${data.title}</h3>
        <ul style="margin:0 0 12px; padding-left:20px; line-height:1.6;">${symptomsHtml}</ul>
        <p class="muted" style="${data.urgent ? "color:#B23A3A; font-weight:600;" : ""}">${data.note}</p>
      `;
      detailBox.classList.remove("hidden");
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const moodBtn = document.getElementById("moodJumpBtn");
  if (moodBtn) {
    moodBtn.addEventListener("click", () => {
      const moodSection = document.getElementById("moodRow");
      if (moodSection) moodSection.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
});
