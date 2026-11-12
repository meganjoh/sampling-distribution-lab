# The Sampling Lab — Version 2

An interactive, mobile-friendly teaching applet for **sampling distributions and the Central Limit Theorem**. Built as a static HTML/CSS/JavaScript website for introductory statistics students, with no login, server, or programming required for students.

**Student webpage:** https://meganjoh.github.io/sampling-distribution-lab/

## What's new in Version 2

- **Opening prediction:** Students choose whether an individual customer wait time or the average of 36 wait times will vary more. The choice is not graded; students revisit it after experimenting.
- **Draw and inspect one sample:** **Draw 1 sample** displays the individual simulated wait times, a dot plot of those values, the sample mean, and the calculation that produced it. The orange diamond on the sampling-distribution plot marks that inspected mean.
- **Large batches stay separate:** Generating **+100** or **+1,000** samples adds their means to the distribution without overwriting the example of one sample the student is inspecting.
- **Build the distribution gradually:** For fewer than 20 sample means, individual means are shown as dots; from 20 onward, a density histogram appears.
- **Fair comparisons:** The three plots for `n = 1`, `n = 4`, and `n = 36` retain their results as students switch sample sizes. All use the same horizontal range **0–40 minutes** and the same probability-density vertical scale. This lets students compare experiments even if they generate different numbers of samples.
- **Guided inquiry:** Center, spread, and shape prompts prepare students to articulate what they observe, rather than see the theorem first.
- **Reveal the mathematics:** The formulas stay hidden until students choose to reveal them. The theory panel includes the expected standard deviations for all three sample sizes.
- **Reset:** *Clear samples* affects only the active sample size. *Start over* clears the three sampling experiments, opening prediction, and revealed theory.

## Update your existing GitHub Pages website (no JavaScript experience required)

1. Download and extract **sampling-distribution-lab-v2.zip**.
2. Open your existing repository: https://github.com/meganjoh/sampling-distribution-lab
3. On the **Code** tab, choose **Add file → Upload files**.
4. Select the **five main files from the extracted folder**: `index.html`, `styles.css`, `script.js`, `math.js`, and `README.md`. **Upload files, not the ZIP.** The first four must appear at the **top level** of the repository (beside `README.md`).
5. GitHub should indicate that those files already exist and will be replaced. Commit the changes, which updates their content.
6. Keep GitHub Pages configured for branch `main` and folder `/(root)` (you should not need to change this). Refresh https://meganjoh.github.io/sampling-distribution-lab/ after the new version publishes. A forced refresh (`Ctrl+Shift+R` on Windows) can help if a cached version appears.

The optional `sampling-lab-qr.png` is the same QR code destination as before, so **your existing QR code remains valid**. The optional `package.json` and `tests` folder are for technical tests; neither is required for GitHub Pages or classroom use.

## Suggested student activity (about 12–15 minutes)

1. **Predict:** Choose the opening prediction before generating any data.
2. **Inspect:** Select `n = 4`, choose **Draw 1 sample**, and examine how four individual wait times produce one sample mean. Draw a second sample. Notice the different mean.
3. **Simulate:** Select `n = 1`; generate **+1,000**. Do the same for `n = 4` and `n = 36`.
4. **Compare:** Discuss the three questions about **center**, **spread**, and **shape**. The original right-skewed population has not changed.
5. **Explain:** Reveal the mathematics and compare empirical standard deviations to 8, 4, and 1.33 minutes. Revisit the opening prediction.

For a faster demonstration, project your own simulation on a laptop. Students who have no device can still predict and discuss. For classroom internet failure, have static screenshots in your slides.

## Statistical model

Each individual wait time is sampled independently from an **exponential distribution** with population mean `μ = 8` minutes and population standard deviation `σ = 8` minutes. It is a teaching model, **not actual coffee-shop data**.

For every sample of `n` independent customer wait times, the applet calculates the arithmetic mean. The sample means are used to build the empirical sampling distribution.

- `E[X̄] = μ = 8` minutes.
- `SD(X̄) = σ / √n = 8 / √n` minutes.
- The CLT explains why the distribution of sample means approaches a normal distribution as `n` grows, even though the original population is right-skewed. There is no universal threshold of `n = 30` for approximate normality.

*Graphs:* Horizontal graph range is 0–40 minutes. Rare observations or sample means above 40 are not drawn but are included in all sample-mean calculations and reported statistics. Comparison histograms are normalized by **all** generated sample means, including those beyond the plot range, so they are density estimates on the common scale. Histograms may have clipped peaks when very few sample means have been generated. The applet therefore displays dots for the first 19 means.

*Rounding:* Individual wait times and calculated sample means are displayed rounded to 2 decimals. Small rounding discrepancies are possible if students manually recompute from the displayed values.

## Files

- `index.html` — page structure and teaching prompts.
- `styles.css` — responsive design for phones and desktop browsers.
- `math.js` — statistical model and summary functions (dependency-free).
- `script.js` — student interactions and SVG visualizations.
- `sampling-lab-qr.png` — classroom QR code pointing to the published GitHub Pages URL.
- `package.json` and `tests/math.test.mjs` — optional automated statistical checks.

You can run the numerical tests with `npm test` if you have Node.js installed. The app itself needs no installation. It does not collect, store, or transmit student data; predictions and sample means exist only in memory until the tab is refreshed.
