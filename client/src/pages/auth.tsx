import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookOpenText, KeyRound, UserRound } from "lucide-react";

type AuthPageProps = {
  initialMode?: "login" | "register";
};

export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [aimsNumber, setAimsNumber] = useState("");
  const [waqfNumber, setWaqfNumber] = useState("");
  const [wasiyatNumber, setWasiyatNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [interests, setInterests] = useState("");
  const [achievements, setAchievements] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login, register, loading, error } = useAuth();
  const currentStatus = user?.status || user?.accountStatus;

  useEffect(() => {
    if (user) {
      setLocation(currentStatus === "pending" ? "/pending-approval" : "/feed");
    }
  }, [currentStatus, setLocation, user]);

  if (user) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  const handleSubmit = async () => {
    if (mode === "login") {
      const nextUser = await login({ username, password });
      const nextStatus = nextUser?.status || nextUser?.accountStatus;

      if (nextUser) {
        toast({
          title: nextStatus === "pending" ? "Login berhasil" : "Login berhasil!",
          description: nextStatus === "pending" ? "Akun Anda masih menunggu persetujuan admin." : undefined,
        });
        setLocation(nextStatus === "pending" ? "/pending-approval" : "/feed");
      } else {
        toast({
          title: "Login gagal",
          description: error || "Periksa kembali username/email dan password Anda.",
          variant: "destructive",
        });
      }
      return;
    }

    const nextUser = await register({
      name,
      username,
      password,
      email,
      bio,
      aimsNumber,
      waqfNumber,
      wasiyatNumber,
      birthDate,
      interests,
      achievements,
    });

    const nextStatus = nextUser?.status || nextUser?.accountStatus;

    if (nextUser) {
      toast({
        title: "Registrasi berhasil!",
        description:
          nextStatus === "pending"
            ? "Akun Anda sedang menunggu persetujuan admin. Anda dapat masuk dalam mode read-only."
            : "Akun Anda sudah aktif dan siap digunakan.",
      });
      setLocation(nextStatus === "pending" ? "/pending-approval" : "/feed");
    } else {
      toast({
        title: "Registrasi gagal",
        description: error || "Periksa kembali data registrasi Anda.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-6">
        <section className="amanat-panel overflow-hidden">
          <div className="border-b border-border/70 bg-primary/8 px-6 py-6">
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Gerbang Komunitas</p>
            <h1 className="mt-2 text-4xl font-bold">Masuk ke ruang diskusi yang sehat dan bermartabat.</h1>
          </div>
          <div className="space-y-4 p-6 text-sm text-muted-foreground">
            <p>Di AMANAT, akun bukan hanya untuk membaca, tetapi untuk ikut membangun budaya ilmu, akhlak, dan persatuan.</p>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="font-medium text-foreground">Aturan ringkas</p>
              <ul className="mt-2 space-y-2">
                <li>Tulis dengan niat memperjelas, bukan memperkeruh.</li>
                <li>Utamakan referensi, adab, dan manfaat untuk jamaah.</li>
                <li>Prestasi dan kontribusi akan memperkuat rank Anda.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="amanat-panel p-6">
          <div className="mb-6 flex gap-2">
            <Button variant={mode === "login" ? "default" : "outline"} className="rounded-xl" onClick={() => setMode("login")}>
              <KeyRound className="mr-2 h-4 w-4" />
              Masuk
            </Button>
            <Button variant={mode === "register" ? "default" : "outline"} className="rounded-xl" onClick={() => setMode("register")}>
              <UserRound className="mr-2 h-4 w-4" />
              Daftar
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Username atau Email</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="mis. mono_admin atau nama@email.com" className="rounded-xl" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="rounded-xl" />
            </div>

            {mode === "register" ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium">Nama lengkap</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" className="rounded-xl" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opsional" className="rounded-xl" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">AIMS Number</label>
                    <Input value={aimsNumber} onChange={(e) => setAimsNumber(e.target.value)} placeholder="Wajib" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Waqf Number</label>
                    <Input value={waqfNumber} onChange={(e) => setWaqfNumber(e.target.value)} placeholder="Opsional" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Wasiyat Number</label>
                    <Input value={wasiyatNumber} onChange={(e) => setWasiyatNumber(e.target.value)} placeholder="Opsional" className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Tanggal lahir</label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Pengantar singkat</label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Minat diskusi, bidang ilmu, atau kegiatan komunitas Anda." className="rounded-2xl" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Interests</label>
                  <Textarea value={interests} onChange={(e) => setInterests(e.target.value)} rows={3} placeholder="Minat atau bidang yang Anda sukai." className="rounded-2xl" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Achievements</label>
                  <Textarea value={achievements} onChange={(e) => setAchievements(e.target.value)} rows={3} placeholder="Prestasi, pengalaman, atau kontribusi Anda." className="rounded-2xl" />
                </div>
              </>
            ) : null}

            <Button className="w-full rounded-2xl" size="lg" disabled={loading} onClick={handleSubmit}>
              <BookOpenText className="mr-2 h-4 w-4" />
              {mode === "login" ? "Masuk ke Forum" : "Daftar dan Mulai Berdiskusi"}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </section>
      </div>
    </Layout>
  );
}
