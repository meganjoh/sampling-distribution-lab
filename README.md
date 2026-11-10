# The Sampling Lab

An interactive teaching applet for **sampling distributions and the Central Limit Theorem**, designed for introductory statistics students. It is a static website and works on phones and computers without installing software.

## What students can do

1. See a strongly right-skewed population of individual customer wait times.
2. Predict what happens to sample means as sample size grows.
3. Choose a sample size (`n = 1`, `4`, or `36`) and generate 1, 100, or 1,000 random samples.
4. Watch a histogram of sample means build up.
5. Compare experiments side by side using the **same horizontal and vertical scales**.
6. Reveal the formulas for the mean and standard error of the sampling distribution.

Results are saved only in the current browser tab (in memory). No student information is collected and no external scripts or services are used.

## Publish with GitHub Pages (no coding required)

If you're reading this in an extracted ZIP, the easiest way to upload all the files:

1. Open your GitHub repository (`https://github.com/meganjoh/sampling-distribution-lab`).
2. Select **Add file** → **Upload files** (you may need to open the **Code** tab first).
3. Upload `index.html`, `styles.css`, `math.js`, `script.js`, and this `README.md` to the **top level** of the repository. If `README.md` already exists, GitHub will replace it with this version when you commit.
4. Select **Commit changes**.
5. In the repository, open **Settings → Pages**. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, and folder to **/(root)**; then **Save**.
6. After publication, visit: **https://meganjoh.github.io/sampling-distribution-lab/**

No `npm`, build process, server, or GitHub Actions configuration is needed. Upload the optional `sampling-lab-qr.png` for later use in your teaching slides; it does not need to be uploaded for the applet to work.

## Use locally

The easiest local test is to serve the directory with a simple local web server (because the JS uses modules):

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser. Alternatively, test the live GitHub Pages address after uploading.

## Instructor notes

**Teaching model.** The population is exponential with population mean `μ = 8` minutes and population standard deviation `σ = 8` minutes. Every individual observation is independently generated from this distribution using inverse-transform sampling:

`X = -8 × ln(1 - U)` for `U ~ Uniform(0, 1)`.

For each sample of size `n`, the applet computes its arithmetic mean. Repeating this produces an empirical sampling distribution. Theory gives:

- `E[X̄] = μ = 8`.
- `SD(X̄) = σ / √n = 8 / √n`.

The simulation shows observed mean and observed sample standard deviation of the generated sample means (the latter requires at least two sample means). These can differ from the theoretical values when few samples have been generated.

**Interpretation.** The CLT concerns the distribution of standardized sample means, not a transformation of the original population. A finite-variance assumption and independence are important. There is no universal `n = 30` threshold at which all sample means become normal.

**Graphs.** The comparison histograms show estimated probability density and use fixed scales (`0–40` minutes on the x-axis and the same y-axis scale). Very rare sample means above 40 minutes are omitted from the graph but included in reported statistics. The population graph is a theoretical density, not a histogram of observed data.

**Suggested lesson sequence (10–12 minutes):** Ask for predictions → `n = 1` generate 1,000 → `n = 4` generate 1,000 → `n = 36` generate 1,000 → compare the graphs → reveal the mathematics. For showing sampling variability, first generate only a handful of samples before generating 1,000.

## Testing

If Node.js is installed, from the project directory run:

```bash
node --test tests/*.test.mjs
```

These tests check theoretical standard errors, simulated means, and histogram normalization.

## Accessibility and reliability

- Buttons can be used with keyboard or touch.
- Graphics include descriptive text for assistive technologies.
- Large controls support phone use.
- No network requests are needed after the site loads.
- For a classroom internet outage, keep screenshots of the population and sampling distributions in the slide deck as a backup.
