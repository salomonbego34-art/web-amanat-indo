import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useCreateArticle, useArticle, useUpdateArticle } from "@/hooks/use-articles";
import { insertArticleSchema } from "@shared/schema";
import { api, type ArticleInput } from "@shared/routes";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SmartBackButton } from "@/components/smart-back-button";
import { useSmartBack } from "@/hooks/use-smart-back";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

export default function Submit() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // detect edit mode
  const queryParams = new URLSearchParams(location.split("?")[1] || "");
  const editId = queryParams.get("edit") ? Number(queryParams.get("edit")) : null;
  const { data: existingArticle, isLoading: articleLoading } = useArticle(editId);
  const { goBack } = useSmartBack(editId ? `/post/${editId}` : "/feed");

  const { mutate: createArticle, isPending: creating } = useCreateArticle();
  const { mutate: updateArticle, isPending: updating } = useUpdateArticle();
  const isLoadingSubmit = creating || updating;
  const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

  const form = useForm<ArticleInput>({
    resolver: zodResolver(api.articles.create.input),
    defaultValues: {
      title: "",
      url: "",
      content: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
      hashtags: "",
    },
  });

  // when editing, populate form once article is loaded
  useEffect(() => {
    if (existingArticle) {
      form.reset({
        title: existingArticle.title || "",
        url: existingArticle.url || "",
        content: existingArticle.content || "",
        location: existingArticle.location || "",
        latitude: existingArticle.latitude,
        longitude: existingArticle.longitude,
        hashtags: existingArticle.hashtags || "",
      });
      if (existingArticle.attachmentDataUrl) {
        // data URL is available but we don't have File object; we'll just preview
        setSelectedFile(null); // keep as null but we track dataURL separately via form state if needed
      }
    }
  }, [existingArticle]);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || (editId && articleLoading)) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  const userStatus = user?.status || user?.accountStatus;
  if (userStatus === "pending") {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto px-4 py-12">
          <div className="amanat-panel p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-yellow-500/10">
                <Loader2 className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Menunggu Persetujuan</h1>
            <p className="text-muted-foreground">
              Akun Anda sedang dalam tahap peninjauan oleh admin. Anda belum dapat membuat thread baru sampai akun Anda diaktifkan.
            </p>
            <Button onClick={() => setLocation("/feed")} variant="outline" className="rounded-xl">
              Kembali ke Feed
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  async function onSubmit(data: ArticleInput) {
    let attachmentDataUrl: string | undefined;
    let attachmentName: string | undefined;
    let attachmentMime: string | undefined;

    if (selectedFile) {
      attachmentDataUrl = await readFileAsDataUrl(selectedFile);
      attachmentName = selectedFile.name;
      attachmentMime = selectedFile.type || "application/octet-stream";
    } else if (existingArticle && existingArticle.attachmentDataUrl) {
      // preserve existing attachment if user didn't change it
      attachmentDataUrl = existingArticle.attachmentDataUrl || undefined;
      attachmentName = existingArticle.attachmentName || undefined;
      attachmentMime = existingArticle.attachmentMime || undefined;
    }

    const payload: ArticleInput = {
      ...data,
      url: data.url?.trim() ? data.url : "",
      title: data.title?.trim() ? data.title : selectedFile?.name || "Untitled Post",
      content: data.content || "",
      location: data.location || "",
      latitude: data.latitude,
      longitude: data.longitude,
      hashtags: data.hashtags || "",
      attachmentDataUrl,
      attachmentName,
      attachmentMime,
    } as ArticleInput;

    const opts = {
      onSuccess: (savedArticle: any) => {
        toast({
          title: editId ? "Article Updated" : "Article Submitted!",
          description: editId ? "Your post has been updated." : "Your story has been posted successfully.",
        });
        if (editId) {
          goBack(`/post/${editId}`);
          return;
        }
        if (savedArticle?.id) {
          setLocation(`/post/${savedArticle.id}`);
          return;
        }
        setLocation("/feed");
      },
      onError: (error: unknown) => {
        toast({
          title: editId ? "Update Failed" : "Submission Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      },
    };

    if (editId && existingArticle) {
      updateArticle({ id: editId, data: payload }, opts as any);
    } else {
      createArticle(payload, opts as any);
    }
  }

  async function importFileToContent(file: File) {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsDataURL(file);
    });

    setIsImporting(true);
    try {
      const res = await fetch("/api/import/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type,
          dataUrl,
        }),
      });
      if (!res.ok) throw new Error("Import file gagal");
      const data = await res.json();
      setImportPreview(data.text || "");
      form.setValue("content", data.text || "");
      setImportDialogOpen(true);
    } catch (error: unknown) {
      toast({
        title: "Import gagal",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  }

  if (authLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <div className="mb-4">
          <SmartBackButton
            fallback={editId ? `/post/${editId}` : "/feed"}
            label={editId ? "Kembali ke Thread" : "Kembali"}
            className="rounded-xl"
          />
        </div>

        <Card className="border-border/60 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-display">Buat Thread AMANAT</CardTitle>
            <CardDescription>
              Bagikan berita komunitas, edukasi, prestasi, atau topik diskusi dalam format teks, gambar, atau dokumen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Thread</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Tulis judul yang jelas dan memancing diskusi sehat" 
                          className="h-12 text-lg" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Fokus pada kejelasan, bukan clickbait.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL (opsional jika upload file/foto)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/article" 
                          className="font-mono text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi (opsional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Jakarta Selatan"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Tambahkan nama lokasi untuk thread ini
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude (opsional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="-6.200000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude (opsional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="106.816666"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl w-full"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        form.setValue('latitude', pos.coords.latitude);
                        form.setValue('longitude', pos.coords.longitude);
                        toast({ title: "Lokasi diperoleh", description: "Koordinat lokasi Anda telah ditambahkan." });
                      }, (err) => {
                        toast({ title: "Error", description: "Tidak dapat mengakses lokasi. " + err.message, variant: "destructive" });
                      });
                    } else {
                      toast({ title: "Error", description: "Browser tidak mendukung Geolocation", variant: "destructive" });
                    }
                  }}
                >
                  📍 Gunakan Lokasi Saya
                </Button>


                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Isi Utama</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tuliskan inti berita, opini, atau bahan diskusi..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hashtags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag (opsional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: #ilmu #berita #prestasi"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Lampiran (gambar, PDF, Word, dll)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) {
                          setSelectedFile(null);
                          return;
                        }
                        const allowed = [
                          "application/pdf",
                          "application/msword",
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                          "application/vnd.ms-powerpoint",
                          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                          "application/vnd.ms-excel",
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                          "text/plain",
                        ];
                        const isAllowed = (typeof file.type === 'string' && file.type.startsWith("image/")) || allowed.includes(file.type);
                        if (!isAllowed) {
                          toast({
                            title: "Format file tidak didukung",
                            description: "Gunakan gambar, PDF, Word, PPT, XLS, atau TXT.",
                            variant: "destructive",
                          });
                          e.target.value = "";
                          return;
                        }
                        if (file.size > MAX_UPLOAD_SIZE) {
                          toast({
                            title: "File terlalu besar",
                            description: "Maksimum ukuran file adalah 5MB.",
                            variant: "destructive",
                          });
                          e.target.value = "";
                          return;
                        }
                        setSelectedFile(file);
                      }}
                    />
                  </FormControl>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      disabled={isImporting}
                      onClick={() => {
                        if (!selectedFile) {
                          toast({ title: "Pilih file PDF atau DOCX dulu", variant: "destructive" });
                          return;
                        }
                        if (!selectedFile.name.toLowerCase().endsWith(".pdf") && !selectedFile.name.toLowerCase().endsWith(".docx")) {
                          toast({ title: "Import hanya untuk PDF atau DOCX", variant: "destructive" });
                          return;
                        }
                        importFileToContent(selectedFile);
                      }}
                    >
                      {isImporting ? "Mengimpor..." : "Import File"}
                    </Button>
                  </div>
                  {selectedFile && (
                    <div className="mt-2">
                      <p className="text-sm">Preview lampiran:</p>
                      {typeof selectedFile.type === 'string' && selectedFile.type.startsWith("image/") && (
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="preview"
                          loading="lazy"
                          className="max-h-40 mt-1 rounded"
                        />
                      )}
                      <p className="text-xs mt-1">{selectedFile.name}</p>
                    </div>
                  )}
                  {!selectedFile && existingArticle?.attachmentDataUrl && (
                    <div className="mt-2">
                    <p className="text-sm">Lampiran saat ini:</p>
                      {existingArticle.attachmentMime?.startsWith("image/") && (
                        <img
                          src={existingArticle.attachmentDataUrl}
                          alt="current" 
                          loading="lazy"
                          className="max-h-40 mt-1 rounded"
                        />
                      )}
                      <p className="text-xs mt-1">{existingArticle.attachmentName}</p>
                    </div>
                  )}
                  <FormDescription>
                    Gunakan lampiran seperlunya. Fokus utama tetap isi dan kualitas diskusi.
                  </FormDescription>
                </FormItem>

                <div className="pt-4 flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => goBack(editId ? `/post/${editId}` : "/feed")}
                    disabled={isLoadingSubmit}
                  >
                    Cancel
                  </Button>
                    <Button 
                      type="submit" 
                      className="min-w-[120px]"
                      disabled={isLoadingSubmit}
                    >
                    {isLoadingSubmit ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-2xl rounded-3xl">
            <DialogHeader>
              <DialogTitle>Preview Hasil Import</DialogTitle>
              <DialogDescription>Teks hasil parsing file akan masuk ke isi utama thread.</DialogDescription>
            </DialogHeader>
            <Textarea rows={14} value={importPreview} onChange={(e) => setImportPreview(e.target.value)} className="rounded-2xl" />
            <div className="flex justify-end">
              <Button
                className="rounded-xl"
                onClick={() => {
                  form.setValue("content", importPreview);
                  setImportDialogOpen(false);
                }}
              >
                Gunakan Hasil Ini
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
