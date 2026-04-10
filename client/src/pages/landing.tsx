import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { BookOpenText, ShieldCheck, Sparkles, Trophy, Users2 } from "lucide-react";

const pillars = [
  {
    icon: <BookOpenText className="h-5 w-5 text-primary" />,
    title: "Ilmu",
    description: "Berita komunitas, edukasi, dan diskusi yang menambah wawasan.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    title: "Akhlak",
    description: "Moderasi aktif agar percakapan tetap sehat, santun, dan anti toxic.",
  },
  {
    icon: <Users2 className="h-5 w-5 text-primary" />,
    title: "Persatuan",
    description: "Forum untuk saling menguatkan, bukan sekadar berdebat tanpa arah.",
  },
  {
    icon: <Trophy className="h-5 w-5 text-primary" />,
    title: "Prestasi",
    description: "Ruang apresiasi hizeb, kegiatan, event, dan kontribusi anggota.",
  },
];

export default function Landing() {
  return (
    <Layout>
      <section className="relative overflow-hidden min-h-screen w-full overflow-x-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_40%)]" />
        <div className="absolute left-10 top-24 h-40 w-40 rounded-full border border-primary/20 bg-primary/5 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-6">
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Selamat datang di AMANAT</p>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] md:text-7xl">
              Amanat News Hub
              <span className="mt-3 block text-accent">Are You Ready?</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              AMANAT adalah pusat diskusi komunitas berbasis teks, berita, edukasi, dan prestasi anggota.
              Rasanya akrab seperti forum komunitas, tetapi tetap modern, rapi, dan fokus pada kualitas percakapan.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth">
                <Button size="lg" className="rounded-2xl px-8">Masuk</Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="rounded-2xl px-8">Daftar</Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="rounded-full border border-border bg-card px-4 py-2">Diskusi sehat</div>
              <div className="rounded-full border border-border bg-card px-4 py-2">Berita komunitas</div>
              <div className="rounded-full border border-border bg-card px-4 py-2">Edukasi</div>
              <div className="rounded-full border border-border bg-card px-4 py-2">Prestasi anggota</div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="amanat-panel overflow-hidden">
              <div className="border-b border-border/70 bg-primary/8 px-6 py-5">
                <p className="text-xs uppercase tracking-[0.28em] text-primary">Identitas Jamiah Ahmadiyah Indonesia</p>
                <h2 className="mt-2 text-3xl font-bold">Forum yang mengutamakan adab, ilmu, dan kemajuan bersama.</h2>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {pillars.map((pillar) => (
                  <div key={pillar.title} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                      {pillar.icon}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-accent/25 bg-accent/10 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-5 w-5 text-accent" />
                <div>
                  <p className="font-semibold">Bukan sosial media visual.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tidak ada reels, tidak ada story, dan tidak ada UI ala Instagram. Fokus utama tetap diskusi, berita, dan kontribusi nyata.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
