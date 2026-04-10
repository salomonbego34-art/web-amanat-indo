import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSmartBack } from "@/hooks/use-smart-back";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileImageCropper } from "@/components/profile-image-cropper";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Image,
  Lock,
  LogOut,
  Palette,
  Save,
  Shield,
  SwitchCamera,
  User,
} from "lucide-react";
import { Layout } from "@/components/layout";

type Section = "main" | "profile" | "photo" | "theme" | "account";

export default function SettingsPage() {
  const { user, updateProfile, logout, loading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { goBack } = useSmartBack("/profile");
  const [activeSection, setActiveSection] = useState<Section>("main");

  const [nama, setNama] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocationState] = useState("");
  const [achievements, setAchievements] = useState("");
  const [interests, setInterests] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [aimsNumber, setAimsNumber] = useState("");
  const [wasiyatNumber, setWasiyatNumber] = useState("");
  const [waqfNumber, setWaqfNumber] = useState("");
  const [hizebStatus, setHizebStatus] = useState<"Jamiah Student" | "Mubaligh">("Jamiah Student");

  const [cropOpen, setCropOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
      return;
    }

    if (!user) {
      return;
    }

    setNama(user.name ?? user.nama ?? "");
    setBio(user.bio ?? "");
    setLocationState(user.location ?? "");
    setAchievements(user.achievements ?? "");
    setInterests(user.interests ?? "");
    setBirthDate(typeof user.birthDate === "string" ? user.birthDate : "");
    setAimsNumber(user.aimsNumber ?? "");
    setWasiyatNumber(user.wasiyatNumber ?? user.waisiyatNumber ?? "");
    setWaqfNumber(user.waqfNumber ?? "");
    setHizebStatus((user.hizebStatus as "Jamiah Student" | "Mubaligh") ?? "Jamiah Student");
    setProfileImageUrl(user.profileImageUrl ?? null);
  }, [user, setLocation]);

  const handleSaveProfile = async () => {
    const success = await updateProfile({
      name: nama,
      nama,
      bio,
      location,
      achievements,
      interests,
      birthDate: birthDate || undefined,
      aimsNumber,
      wasiyatNumber: wasiyatNumber || undefined,
      waqfNumber: waqfNumber || undefined,
      hizebStatus,
    });

    if (success) {
      toast({ title: "Profil diperbarui" });
      goBack("/profile");
    } else {
      toast({
        title: "Error",
        variant: "destructive",
      });
    }
  };

  const handleSavePhoto = async (dataUrl: string) => {
    setProfileImageUrl(dataUrl);
    const success = await updateProfile({
      profileImageUrl: dataUrl,
    });

    if (success) {
      toast({ title: "Foto profil diperbarui" });
      goBack("/profile");
    }
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      setLocation("/");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-muted-foreground">Memuat pengaturan...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <div className="p-6 text-center text-red-500">No data</div>;
  }

  const menuItems = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "photo" as const, label: "Change Photo", icon: Image },
    { id: "theme" as const, label: "Theme", icon: Palette },
    { id: "account" as const, label: "Account & Security", icon: Lock },
  ];

  return (
    <Layout>
      <div className="min-h-screen w-full bg-background">
        <div className="sticky top-0 z-50 flex items-center gap-3 border-b bg-background p-4">
          <button
            type="button"
            onClick={() => (activeSection === "main" ? goBack("/profile") : setActiveSection("main"))}
            className="inline-flex items-center gap-2 rounded-lg p-2 -ml-1 text-primary transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <h1 className="flex-1 text-lg font-semibold">
            {activeSection === "main" ? "Pengaturan" : menuItems.find((item) => item.id === activeSection)?.label}
          </h1>
        </div>

        <div className="mx-auto max-w-4xl p-4 pt-4 md:p-8">
          {activeSection === "main" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className="group flex items-center gap-4 rounded-2xl border border-border/50 p-6 text-left transition-all hover:border-primary hover:shadow-lg"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{item.label}</h3>
                        <p className="text-sm text-muted-foreground">Kelola {item.label.toLowerCase()}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </button>
                  );
                })}
              </div>

              <Button
                variant="destructive"
                className="w-full rounded-xl py-6 text-lg font-bold shadow-lg"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Keluar dari Akun
              </Button>
            </div>
          )}

          {activeSection === "profile" && (
            <div className="space-y-6">
              <div className="space-y-6 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                <div>
                  <label className="mb-2 block text-sm font-bold">Nama Lengkap</label>
                  <Input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama Lengkap Sesuai AIMS"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">Tanggal Lahir</label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="h-12 rounded-xl pl-10"
                      />
                      <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">Status Hizeb</label>
                    <Select value={hizebStatus} onValueChange={(value: "Jamiah Student" | "Mubaligh") => setHizebStatus(value)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Jamiah Student">Jamiah Student</SelectItem>
                        <SelectItem value="Mubaligh">Mubaligh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-bold">Nomor AIMS</label>
                    <Input
                      value={aimsNumber}
                      onChange={(e) => setAimsNumber(e.target.value)}
                      placeholder="Contoh: 12345"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">Nomor Wasiyat (Opsional)</label>
                    <Input
                      value={wasiyatNumber}
                      onChange={(e) => setWasiyatNumber(e.target.value)}
                      placeholder="Jika ada"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">Nomor Waqf (Opsional)</label>
                    <Input
                      value={waqfNumber}
                      onChange={(e) => setWaqfNumber(e.target.value)}
                      placeholder="Jika ada"
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">Lokasi</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocationState(e.target.value)}
                    placeholder="Kota, Provinsi"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">Bio Singkat</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ceritakan tentang diri Anda..."
                    className="min-h-[100px] rounded-xl"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">Pencapaian</label>
                  <Textarea
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value)}
                    placeholder="Daftar pencapaian Anda..."
                    className="min-h-[100px] rounded-xl"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">Minat & Hobi</label>
                  <Textarea
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="Apa minat dan hobi Anda?"
                    className="min-h-[100px] rounded-xl"
                  />
                </div>

                <Button
                  className="h-14 w-full rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  <Save className="mr-2 h-6 w-6" />
                  {loading ? "Menyimpan..." : "Simpan Profil"}
                </Button>
              </div>
            </div>
          )}

          {activeSection === "photo" && (
            <div className="space-y-6">
              <div className="space-y-6 rounded-2xl border border-border/50 bg-card p-6 text-center">
                <div className="relative inline-block">
                  <img
                    src={profileImageUrl || "/default-avatar.png"}
                    alt="Profile"
                    loading="lazy"
                    className="h-32 w-32 rounded-full border-4 border-primary/20 object-cover"
                  />
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (event: Event) => {
                        const target = event.target as HTMLInputElement;
                        const file = target.files?.[0];
                        if (file) {
                          setCropFile(file);
                          setCropOpen(true);
                        }
                      };
                      input.click();
                    }}
                  >
                    <SwitchCamera className="h-5 w-5" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Foto Profil</h3>
                  <p className="text-sm text-muted-foreground">Gunakan foto wajah yang jelas agar mudah dikenali</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "theme" && (
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <ThemeSwitcher />
            </div>
          )}

          {activeSection === "account" && (
            <div className="space-y-6 rounded-2xl border border-border/50 bg-card p-6">
              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-bold">Privasi Data</h4>
                    <p className="text-sm text-muted-foreground">Enkripsi data pribadi aktif</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              </div>

              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-sm leading-relaxed text-primary">
                  <strong>Catatan Keamanan:</strong> Penggantian password saat ini hanya dapat dilakukan melalui admin untuk
                  memastikan integritas database amanat.app.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {cropOpen && cropFile && (
        <ProfileImageCropper
          file={cropFile}
          open={cropOpen}
          onOpenChange={(open) => {
            setCropOpen(open);
            if (!open) {
              setCropFile(null);
            }
          }}
          onComplete={(dataUrl) => {
            handleSavePhoto(dataUrl);
            setCropOpen(false);
            setCropFile(null);
          }}
        />
      )}
    </Layout>
  );
}
