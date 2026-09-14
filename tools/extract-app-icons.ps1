<#
  Extracts 256px application icons from locally installed software into
  img/tools/, so the tools wall on the homepage shows the real marks.

  Source is Michael's own licensed installs, not a downloaded icon set:
  Simple Icons carries no Adobe marks and no Rhino, which are exactly the
  tools the wall needs to lead with.

  Re-run after upgrading an app (paths carry version numbers).
#>

$ErrorActionPreference = 'Stop'
$outDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'img\tools'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ShellIcon {
  [ComImport, Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b"),
   InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IShellItemImageFactory {
    void GetImage(SIZE size, int flags, out IntPtr phbm);
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct SIZE { public int cx; public int cy; }

  [StructLayout(LayoutKind.Sequential)]
  struct BITMAP {
    public int bmType, bmWidth, bmHeight, bmWidthBytes;
    public ushort bmPlanes, bmBitsPixel;
    public IntPtr bmBits;
  }

  const int SIIGBF_BIGGERSIZEOK = 0x1;
  const int SIIGBF_ICONONLY     = 0x4;

  [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
  static extern void SHCreateItemFromParsingName(
    [MarshalAs(UnmanagedType.LPWStr)] string path, IntPtr pbc,
    [MarshalAs(UnmanagedType.LPStruct)] Guid riid,
    [MarshalAs(UnmanagedType.Interface)] out IShellItemImageFactory ppv);

  [DllImport("gdi32.dll")] static extern int GetObject(IntPtr h, int c, ref BITMAP pv);
  [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr h);

  // Bitmap.FromHbitmap discards the alpha channel and leaves a black box
  // behind every icon, so read the 32bpp DIB bits directly instead.
  static Bitmap FromHBitmap(IntPtr hbm) {
    BITMAP bm = new BITMAP();
    GetObject(hbm, Marshal.SizeOf(typeof(BITMAP)), ref bm);
    if (bm.bmBitsPixel != 32) return Bitmap.FromHbitmap(hbm);

    Bitmap view = new Bitmap(bm.bmWidth, bm.bmHeight, bm.bmWidthBytes,
                             PixelFormat.Format32bppArgb, bm.bmBits);
    Bitmap copy = new Bitmap(bm.bmWidth, bm.bmHeight, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(copy)) {
      g.Clear(Color.Transparent);
      g.DrawImage(view, 0, 0);
    }
    view.Dispose();
    // The DIB comes back bottom-up, so reading it row-for-row lands upside
    // down. (The <32bpp fallback above goes through GDI+, which corrects for
    // this already — only this branch needs it.)
    copy.RotateFlip(RotateFlipType.RotateNoneFlipY);
    return copy;
  }

  public static void Save(string source, string dest, int px) {
    IShellItemImageFactory factory;
    SHCreateItemFromParsingName(source, IntPtr.Zero,
      new Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b"), out factory);

    SIZE size; size.cx = px; size.cy = px;
    IntPtr hbm;
    factory.GetImage(size, SIIGBF_ICONONLY | SIIGBF_BIGGERSIZEOK, out hbm);
    try {
      using (Bitmap bmp = FromHBitmap(hbm)) { bmp.Save(dest, ImageFormat.Png); }
    } finally { DeleteObject(hbm); }
  }
}
'@

$apps = [ordered]@{
  'rhino'       = 'C:\Program Files\Rhino 8\System\Rhino.exe'
  'autocad'     = 'C:\Program Files\Autodesk\AutoCAD 2027\acad.exe'
  'sketchup'    = 'C:\Program Files\SketchUp\SketchUp 2026\SketchUp\SketchUp.exe'
  'photoshop'   = 'C:\Program Files\Adobe\Adobe Photoshop 2026\Photoshop.exe'
  'illustrator' = 'C:\Program Files\Adobe\Adobe Illustrator 2026\Support Files\Contents\Windows\Illustrator.exe'
  'indesign'    = 'C:\Program Files\Adobe\Adobe InDesign 2026\InDesign.exe'
  'premiere'    = 'C:\Program Files\Adobe\Adobe Premiere Pro 2026\Adobe Premiere Pro.exe'
  'aftereffects'= 'C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\AfterFX.exe'
  'lightroom'   = 'C:\Program Files\Adobe\Adobe Lightroom Classic\Lightroom.exe'
}

foreach ($name in $apps.Keys) {
  $src = $apps[$name]
  if (-not (Test-Path $src)) { Write-Output ("MISS  {0}  ({1})" -f $name, $src); continue }
  $dest = Join-Path $outDir ("{0}.png" -f $name)
  try {
    [ShellIcon]::Save($src, $dest, 256)
    $kb = [math]::Round((Get-Item $dest).Length / 1KB, 1)
    Write-Output ("OK    {0,-13} {1} KB" -f $name, $kb)
  } catch {
    Write-Output ("FAIL  {0,-13} {1}" -f $name, $_.Exception.Message)
  }
}
