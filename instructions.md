# Client SSL Setup Instructions

To connect to the QuizRacer server securely (without browser warnings) during our presentation, you must configure your machine/browser to trust our custom local Certificate Authority (CA). 

You should have received a file named **`rootCA.pem`** from the Windows host. Keep it handy and follow the instructions for your operating system below.

---

## 🍏 macOS Instructions (System-wide Trust)
On macOS, adding the certificate to your System Keychain makes Safari, Chrome, and Edge trust it automatically.

1. Open the **Keychain Access** app (use Spotlight search: `Cmd + Space`).
2. In the left sidebar, click on **System** (or `login` if System is locked), and click on the **Certificates** tab.
3. Drag and drop the **`rootCA.pem`** file directly into the Keychain Access window.
4. Double-click the newly added certificate (it usually says something like `mkcert development CA`).
5. Expand the triangle next to **Trust**.
6. At the top, change **"When using this certificate:"** to **"Always Trust"**.
7. Close the window. It will ask for your Mac password or Touch ID to confirm the security change.
8. Go to `https://172.28.176.1:5023` in your browser. (Make sure you type `https://`).

---

## 🐧 Linux Instructions (Browser-level Trust)
On Linux, the easiest and most reliable way is to import it directly into your web browser.

### For Firefox (Recommended):
1. Open Firefox and go to `about:preferences#privacy` (Settings -> Privacy & Security).
2. Scroll all the way down to the **Certificates** section.
3. Click the **View Certificates...** button.
4. Click on the **Authorities** tab at the top.
5. Click **Import...** and select the **`rootCA.pem`** file.
6. **CRITICAL:** Check the box that says **"Trust this CA to identify websites"**. Click OK.
7. Go to `https://172.28.176.1:5023`.

### For Chrome, Brave, or Edge:
1. Open Settings -> **Privacy and security** -> **Security**.
2. Click **Manage certificates**.
3. Go to the **Authorities** tab.
4. Click **Import**, choose the **`rootCA.pem`** file.
5. Check the boxes to trust the certificate for websites and click OK.
6. Go to `https://172.28.176.1:5023`.