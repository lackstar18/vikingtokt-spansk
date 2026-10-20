// Vikingtokt-Installer.exe (Elena, 20 oct: «un solo instalador: se descarga el instalador, NO toda la carpeta»).
// Descarga el juego de GitHub a %LOCALAPPDATA%\Vikingtokt, instala Python solo para este usuario si falta,
// ejecuta instalar.ps1 (krigshornet 20:00, duelo, acceso directo) y abre el juego. Sin administrador.
// Compilar: bygg.bat. Probar sin tocar nada del PC: Vikingtokt-Installer.exe /prueba <carpeta>
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("Vikingtokt installer")]
[assembly: AssemblyProduct("Vikingtokt - Spansk A1")]
[assembly: AssemblyCompany("Sailor Lux")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

static class Program
{
    const string ZIP = "https://github.com/lackstar18/vikingtokt-spansk/archive/refs/heads/main.zip";
    const string PY_VER = "3.13.9";
    static readonly string PY_URL = "https://www.python.org/ftp/python/" + PY_VER + "/python-" + PY_VER + "-amd64.exe";
    static readonly string[] BEHOLD = { "progreso.json", "uso_ia.json", "clave_deepseek.txt", "duelo.json", "aviso_estado.json" };   // datos del jugador: nunca se pisan

    static Form f; static Label txt; static ProgressBar bar; static Button ok;
    static string dir, logg; static bool prueba;

    [STAThread]
    static void Main(string[] args)
    {
        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;    // TLS 1.2 (GitHub y python.org)
        dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Vikingtokt");
        if (args.Length == 2 && args[0] == "/prueba") { prueba = true; dir = Path.GetFullPath(args[1]); }
        logg = Path.Combine(Path.GetTempPath(), "vikingtokt_installer.log");
        File.WriteAllText(logg, DateTime.Now + " dir=" + dir + (prueba ? " PRUEBA" : "") + "\r\n");

        Application.EnableVisualStyles();
        f = new Form
        {
            Text = "Vikingtokt", AutoScaleDimensions = new SizeF(96f, 96f), AutoScaleMode = AutoScaleMode.Dpi,
            ClientSize = new Size(460, 170), FormBorderStyle = FormBorderStyle.FixedDialog, MaximizeBox = false, MinimizeBox = false,
            StartPosition = FormStartPosition.CenterScreen, BackColor = Color.FromArgb(20, 28, 51), ForeColor = Color.FromArgb(236, 230, 216),
            Font = new Font("Segoe UI", 11f)
        };
        try { f.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        var tit = new Label { Text = "Vikingtokt · Spansk A1", Font = new Font("Segoe UI", 15f, FontStyle.Bold), ForeColor = Color.FromArgb(224, 176, 79), AutoSize = true, Location = new Point(20, 14) };
        txt = new Label { Text = "Starter …", AutoSize = false, Size = new Size(420, 64), Location = new Point(20, 54) };
        bar = new ProgressBar { Style = ProgressBarStyle.Marquee, MarqueeAnimationSpeed = 30, Size = new Size(420, 16), Location = new Point(20, 130) };
        ok = new Button { Text = "OK", Size = new Size(110, 34), Location = new Point(330, 124), Visible = false, BackColor = Color.FromArgb(224, 176, 79), ForeColor = Color.FromArgb(20, 28, 51), FlatStyle = FlatStyle.Flat };
        ok.Click += (s, e) => f.Close();
        f.Controls.AddRange(new Control[] { tit, txt, bar, ok });
        f.Shown += (s, e) => new Thread(Installer) { IsBackground = true }.Start();
        Application.Run(f);
    }

    static void Vis(string t) { Logg(t); f.BeginInvoke((Action)(() => txt.Text = t)); }
    static void Logg(string t) { try { File.AppendAllText(logg, DateTime.Now.ToString("HH:mm:ss ") + t + "\r\n"); } catch { } }
    static void Slutt(string t, bool feil)
    {
        Logg((feil ? "FEIL: " : "SLUTT: ") + t);
        f.BeginInvoke((Action)(() => { txt.Text = t; txt.Height = 100; bar.Visible = false; ok.Visible = true; if (feil) txt.ForeColor = Color.FromArgb(255, 140, 120); ok.Focus(); }));
    }

    static void Installer()
    {
        try
        {
            string tmp = Path.Combine(Path.GetTempPath(), "vikingtokt_installer");
            if (Directory.Exists(tmp)) Directory.Delete(tmp, true);
            Directory.CreateDirectory(tmp);

            Vis("Laster ned spillet …");
            string zip = Path.Combine(tmp, "spill.zip");
            using (var w = new WebClient()) w.DownloadFile(ZIP, zip);
            Vis("Pakker ut …");
            string ut = Path.Combine(tmp, "ut");
            ZipFile.ExtractToDirectory(zip, ut);
            Kopier(Directory.GetDirectories(ut)[0], dir);

            Vis("Ser etter Python …");
            string py = FinnPython();
            if (py == null)
            {
                if (prueba) throw new Exception("PRUEBA: Python no encontrado (no se instala en modo prueba).");
                Vis("Installerer Python " + PY_VER + " (1–2 minutter) …");
                string inst = Path.Combine(tmp, "python-" + PY_VER + "-amd64.exe");
                using (var w = new WebClient()) w.DownloadFile(PY_URL, inst);
                int k = Kjor(inst, "/quiet InstallAllUsers=0 PrependPath=1 Include_launcher=0 Include_test=0 Include_doc=0 Shortcuts=0 AssociateFiles=0", 600000);
                Logg("python installer exit " + k);
                py = FinnPython();
                if (py == null) throw new Exception("Python ble ikke installert (kode " + k + ").");
            }
            Logg("python=" + py);

            Vis("Setter opp krigshornet og duellen …");
            string ps1 = Path.Combine(dir, "instalar.ps1");
            if (prueba && !File.ReadAllText(ps1).Contains("$Prueba")) throw new Exception("PRUEBA: instalar.ps1 de GitHub no tiene -Prueba; no se ejecuta.");
            int kode = Kjor("powershell.exe", "-NoProfile -ExecutionPolicy Bypass -File \"" + ps1 + "\" -Python \"" + py + "\"" + (prueba ? " -Prueba" : ""), 120000);
            if (kode != 0) throw new Exception("instalar.ps1 ga kode " + kode + ".");
            if (prueba) { Slutt("PRUEBA ok. Python: " + py, false); return; }

            Avinstallering();
            string pyw = Path.Combine(Path.GetDirectoryName(py), "pythonw.exe");
            Process.Start(new ProcessStartInfo(File.Exists(pyw) ? pyw : py, "\"" + Path.Combine(dir, "servidor.py") + "\"") { WorkingDirectory = dir, UseShellExecute = false, CreateNoWindow = true });
            try { Directory.Delete(tmp, true); } catch { }
            Slutt("Ferdig! Spillet åpnes nå.\nNeste gang: «Vikingtokt» på skrivebordet.\nSpør Windows om brannmuren? Trykk «Allow access».", false);
        }
        catch (Exception e)
        {
            Slutt("Noe gikk galt: " + e.Message + "\nSjekk internett og prøv igjen.", true);
            Logg(e.ToString());
        }
    }

    static void Kopier(string fra, string til)
    {
        foreach (string fil in Directory.GetFiles(fra, "*", SearchOption.AllDirectories))
        {
            string rel = fil.Substring(fra.Length + 1);
            if (BEHOLD.Contains(rel, StringComparer.OrdinalIgnoreCase)) continue;
            string mal = Path.Combine(til, rel);
            Directory.CreateDirectory(Path.GetDirectoryName(mal));
            File.Copy(fil, mal, true);
        }
    }

    // Python 3.8+ con tkinter (el aviso de las 20:00 lo usa). Primero el del PATH; luego las carpetas típicas
    // (tras instalarlo, el PATH nuevo aún no se ve desde este proceso).
    static string FinnPython()
    {
        const string sjekk = "-c \"import sys, tkinter; assert sys.version_info >= (3, 8); print(sys.executable)\"";
        string r = Sporre("py", "-3 " + sjekk) ?? Sporre("python", sjekk);
        if (r != null) return r;
        var mapper = new[] {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\Python"),
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles) };
        foreach (string m in mapper)
        {
            if (!Directory.Exists(m)) continue;
            foreach (string d in Directory.GetDirectories(m, "Python3*").OrderByDescending(x => x))
            {
                string exe = Path.Combine(d, "python.exe");
                if (File.Exists(exe) && (r = Sporre(exe, sjekk)) != null) return r;
            }
        }
        return null;
    }

    static string Sporre(string exe, string args)
    {
        try
        {
            var p = Process.Start(new ProcessStartInfo(exe, args) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true });
            p.ErrorDataReceived += (s, e) => { };
            p.BeginErrorReadLine();
            string o = p.StandardOutput.ReadToEnd().Trim();
            if (!p.WaitForExit(20000)) { try { p.Kill(); } catch { } return null; }
            return p.ExitCode == 0 && o.Length > 0 && File.Exists(o.Split('\n')[0].Trim()) ? o.Split('\n')[0].Trim() : null;
        }
        catch { return null; }
    }

    static int Kjor(string exe, string args, int ms)
    {
        Logg("> " + exe + " " + args);
        var p = Process.Start(new ProcessStartInfo(exe, args) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true, StandardOutputEncoding = Encoding.UTF8 });
        p.OutputDataReceived += (s, e) => { if (e.Data != null) Logg("  " + e.Data); };
        p.ErrorDataReceived += (s, e) => { if (e.Data != null) Logg("  ! " + e.Data); };
        p.BeginOutputReadLine(); p.BeginErrorReadLine();
        if (!p.WaitForExit(ms)) { try { p.Kill(); } catch { } return -1; }
        p.WaitForExit();
        return p.ExitCode;
    }

    // «Apps & features» → Vikingtokt → Uninstall (desinstalar.ps1)
    static void Avinstallering()
    {
        string v = "1";
        try { v = File.ReadAllText(Path.Combine(dir, "version.json")).Split(':')[1].Trim(' ', '}', '\r', '\n'); } catch { }
        using (var k = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\Vikingtokt"))
        {
            k.SetValue("DisplayName", "Vikingtokt · Spansk A1");
            k.SetValue("DisplayVersion", v);
            k.SetValue("Publisher", "Sailor Lux");
            k.SetValue("DisplayIcon", Path.Combine(dir, @"arte\vikingtokt.ico"));
            k.SetValue("InstallLocation", dir);
            k.SetValue("UninstallString", "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"" + Path.Combine(dir, "desinstalar.ps1") + "\"");
            k.SetValue("NoModify", 1, RegistryValueKind.DWord);
            k.SetValue("NoRepair", 1, RegistryValueKind.DWord);
        }
    }
}
