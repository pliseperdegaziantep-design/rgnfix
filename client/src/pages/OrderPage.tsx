import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart, CheckCircle2, ArrowLeft, ArrowRight, LogIn, Plus, Trash2, DoorOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CASE_TYPES, MOUNT_TYPES, PROFILE_COLORS, WINDOW_TYPES } from "@shared/types";
import { useSearch } from "wouter";
import { toast } from "sonner";

type MeasurementRow = {
  id: string;
  width: string;
  height: string;
  quantity: string;
  deductSashAllowance: boolean;
  sashAllowance: string;
};

export default function OrderPage() {
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const initialSeriesSlug = params.get("series");

  const { data: fabrics } = trpc.fabrics.list.useQuery();

  const [step, setStep] = useState(1);
  const [measurements, setMeasurements] = useState<MeasurementRow[]>([
    {
      id: "1",
      width: params.get("width") || "",
      height: params.get("height") || "",
      quantity: params.get("count") || "1",
      deductSashAllowance: false,
      sashAllowance: "2",
    },
  ]);
  const [orderData, setOrderData] = useState({
    fabricId: params.get("fabric") || "",
    fabricColor: params.get("fabricColor") || "Sipariş sırasında teyit edilecek",
    windowType: params.get("window") || "",
    profileColor: params.get("profile") || "",
    mountType: params.get("mount") || "",
    caseType: params.get("case") === "slim" ? "slim" as const : "kalin" as const,
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    customerNote: "",
  });

  const createOrderMutation = trpc.orders.create.useMutation();

  const selectedFabric = fabrics?.find((f) => f.id.toString() === orderData.fabricId);
  const availableProfileColors = orderData.caseType === "slim"
    ? PROFILE_COLORS.filter((color) => color.id === "beyaz" || color.id === "antrasit")
    : PROFILE_COLORS;

  useEffect(() => {
    if (!initialSeriesSlug || orderData.fabricId || !fabrics?.length) return;
    const matchedFabric = fabrics.find((fabric) => fabric.slug === initialSeriesSlug);
    if (matchedFabric) {
      setOrderData((current) => ({ ...current, fabricId: matchedFabric.id.toString() }));
    }
  }, [fabrics, initialSeriesSlug, orderData.fabricId]);

  const roundTo5 = (v: number) => Math.ceil(v / 5) * 5;
  const getNetWidth = (measurement: MeasurementRow) => {
    const width = parseFloat(measurement.width) || 0;
    const allowance = orderData.windowType === "cam-balkon" && measurement.deductSashAllowance ? parseFloat(measurement.sashAllowance) || 0 : 0;
    return Math.max(width - allowance, 0);
  };

  const updateMeasurement = (id: string, patch: Partial<MeasurementRow>) => {
    setMeasurements((current) => current.map((measurement) => measurement.id === id ? { ...measurement, ...patch } : measurement));
  };

  const addMeasurement = () => {
    setMeasurements((current) => [
      ...current,
      {
        id: String(Math.max(...current.map((measurement) => Number(measurement.id)), 0) + 1),
        width: "",
        height: "",
        quantity: "1",
        deductSashAllowance: false,
        sashAllowance: "2",
      },
    ]);
  };

  const removeMeasurement = (id: string) => {
    setMeasurements((current) => current.length > 1 ? current.filter((measurement) => measurement.id !== id) : current);
  };

  const totalPrice = useMemo(() => {
    if (!selectedFabric) return 0;
    const caseSurcharge = CASE_TYPES.find((item) => item.id === orderData.caseType)?.surchargePerSqm || 0;
    const unitPrice = parseFloat(selectedFabric.pricePerSqm) + caseSurcharge;

    return measurements.reduce((total, measurement) => {
      const netWidth = getNetWidth(measurement);
      const height = parseFloat(measurement.height) || 0;
      if (netWidth <= 0 || height <= 0) return total;
      const area = Math.max((roundTo5(netWidth) * roundTo5(height)) / 10000, 1);
      return total + area * unitPrice * (parseInt(measurement.quantity) || 1);
    }, 0);
  }, [selectedFabric, measurements, orderData.caseType]);

  const canContinue = useMemo(() => {
    if (step === 1) {
      return Boolean(orderData.fabricId && orderData.windowType && orderData.profileColor && orderData.mountType && orderData.caseType);
    }
    if (step === 2) {
      return measurements.length > 0 && measurements.every((measurement) =>
        getNetWidth(measurement) > 0 && parseFloat(measurement.height) > 0 && parseInt(measurement.quantity) > 0
      );
    }
    if (step === 3) {
      return Boolean(orderData.customerName.trim() && orderData.customerPhone.trim() && orderData.customerCity.trim() && orderData.customerAddress.trim());
    }
    return true;
  }, [orderData, step]);

  const goForward = () => {
    if (!canContinue) {
      toast.error("Devam etmek için zorunlu alanları eksiksiz doldurun.");
      return;
    }
    setStep((current) => current + 1);
  };

  const handleSubmit = async () => {
    try {
      const firstMeasurement = measurements[0];
      const totalQuantity = measurements.reduce((total, measurement) => total + (parseInt(measurement.quantity) || 1), 0);
      const measurementSummary = measurements.map((measurement, index) => {
        const allowanceText = orderData.windowType === "cam-balkon" && measurement.deductSashAllowance ? `, açılır kanat payı -${measurement.sashAllowance} cm` : "";
        return `${index + 1}. ölçü: ${measurement.width} × ${measurement.height} cm, net genişlik ${getNetWidth(measurement)} cm, ${measurement.quantity} adet${allowanceText}`;
      }).join("\n");

      await createOrderMutation.mutateAsync({
        fabricId: parseInt(orderData.fabricId),
        fabricName: selectedFabric?.name || "",
        fabricColor: orderData.fabricColor,
        profileColor: orderData.profileColor,
        mountType: orderData.mountType,
        caseType: orderData.caseType,
        width: getNetWidth(firstMeasurement),
        height: parseFloat(firstMeasurement.height),
        quantity: totalQuantity,
        totalPrice,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        customerCity: orderData.customerCity,
        customerNote: [
          orderData.customerNote.trim(),
          `Uygulama alanı: ${WINDOW_TYPES.find((type) => type.id === orderData.windowType)?.name || orderData.windowType}`,
          "Ölçü detayları:",
          measurementSummary,
        ].filter(Boolean).join("\n"),
      });
      setStep(4);
      toast.success("Siparişiniz başarıyla oluşturuldu!");
    } catch {
      toast.error("Sipariş oluşturulurken bir hata oluştu.");
    }
  };

  return (
    <div className="container py-8 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <ShoppingCart className="h-3.5 w-3.5" />
          Online Sipariş
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">
          Sipariş Oluştur
        </h1>
      </div>

      {!isAuthenticated && (
        <Card className="mb-6 border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <LogIn className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Misafir sipariş modu aktif</p>
                <p className="text-xs text-muted-foreground">
                  Giriş yapmadan sipariş oluşturabilirsiniz. Hesabım üzerinden takip için giriş yapın.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => startLogin()} className="rounded-lg gap-2">
              <LogIn className="h-4 w-4" />
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {["Ürün Seçimi", "Ölçüler", "Teslimat", "Onay"].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step > i + 1 ? "bg-primary text-primary-foreground" :
              step === i + 1 ? "bg-primary/10 text-primary border-2 border-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            {i < 3 && <div className={`w-6 h-0.5 ${step > i + 1 ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-6">
          {/* Step 1: Product */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Kumaş Tipi</Label>
                <Select value={orderData.fabricId} onValueChange={(v) => setOrderData({ ...orderData, fabricId: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Kumaş seçin" /></SelectTrigger>
                  <SelectContent>
                    {fabrics?.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.name} - {f.pricePerSqm} ₺/m²</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Uygulama Alanı</Label>
                <Select
                  value={orderData.windowType}
                  onValueChange={(value) => {
                    setOrderData({ ...orderData, windowType: value });
                    if (value !== "cam-balkon") {
                      setMeasurements((current) => current.map((measurement) => ({ ...measurement, deductSashAllowance: false })));
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Uygulama alanını seçin" /></SelectTrigger>
                  <SelectContent>
                    {WINDOW_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profil Rengi</Label>
                <Select value={orderData.profileColor} onValueChange={(v) => setOrderData({ ...orderData, profileColor: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Profil rengi seçin" /></SelectTrigger>
                  <SelectContent>
                    {availableProfileColors.map((pc) => (
                      <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {orderData.caseType === "slim" ? "Slim kasa: Beyaz veya Antrasit" : "Kalın kasa: Beyaz, Krem, Gümüş Gri veya Antrasit"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Montaj Tipi</Label>
                <Select value={orderData.mountType} onValueChange={(v) => setOrderData({ ...orderData, mountType: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Montaj tipi seçin" /></SelectTrigger>
                  <SelectContent>
                    {MOUNT_TYPES.map((mt) => (
                      <SelectItem key={mt.id} value={mt.id}>{mt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kasa Tipi</Label>
                <Select
                  value={orderData.caseType}
                  onValueChange={(v) => {
                    const nextCase = v === "slim" ? "slim" : "kalin";
                    const profileAllowed = nextCase === "kalin" || orderData.profileColor === "beyaz" || orderData.profileColor === "antrasit";
                    setOrderData({ ...orderData, caseType: nextCase, profileColor: profileAllowed ? orderData.profileColor : "" });
                  }}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Kasa tipi seçin" /></SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}{item.surchargePerSqm ? ` (+${item.surchargePerSqm} ₺/m²)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Measurements */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">Pencere Ölçüleri</h3>
                  <p className="text-xs text-muted-foreground">Her farklı pencere için ayrı ölçü ekleyebilirsiniz.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addMeasurement} className="shrink-0 gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> Ölçü Ekle
                </Button>
              </div>

              <div className="space-y-4">
                {measurements.map((measurement, index) => (
                  <div key={measurement.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <strong className="text-sm">Ölçü {index + 1}</strong>
                      {measurements.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeMeasurement(measurement.id)} className="h-8 gap-1.5 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Kaldır
                        </Button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Genişlik (cm)</Label>
                        <Input type="number" min="1" placeholder="120" value={measurement.width} onChange={(event) => updateMeasurement(measurement.id, { width: event.target.value })} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Yükseklik (cm)</Label>
                        <Input type="number" min="1" placeholder="150" value={measurement.height} onChange={(event) => updateMeasurement(measurement.id, { height: event.target.value })} className="rounded-xl" />
                      </div>
                    </div>

                    {orderData.windowType === "cam-balkon" && <div className="mt-4 flex flex-col gap-4 rounded-xl border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          id={`sash-${measurement.id}`}
                          checked={measurement.deductSashAllowance}
                          onCheckedChange={(checked) => updateMeasurement(measurement.id, { deductSashAllowance: checked })}
                        />
                        <Label htmlFor={`sash-${measurement.id}`} className="cursor-pointer">
                          <span className="flex items-center gap-2"><DoorOpen className="h-4 w-4 text-secondary" /> Açılır kanat payını düş</span>
                          <span className="mt-1 block text-xs font-normal text-muted-foreground">Yalnızca cam balkon için; genişlikten varsayılan 2 cm düşülür.</span>
                        </Label>
                      </div>
                      {measurement.deductSashAllowance && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`allowance-${measurement.id}`} className="whitespace-nowrap text-xs">Düşülecek pay</Label>
                          <Input id={`allowance-${measurement.id}`} type="number" min="0" step="0.5" value={measurement.sashAllowance} onChange={(event) => updateMeasurement(measurement.id, { sashAllowance: event.target.value })} className="h-9 w-20 rounded-lg" />
                          <span className="text-xs text-muted-foreground">cm</span>
                        </div>
                      )}
                    </div>}

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div className="space-y-2">
                        <Label>Adet</Label>
                        <Input type="number" min="1" value={measurement.quantity} onChange={(event) => updateMeasurement(measurement.id, { quantity: event.target.value })} className="w-24 rounded-xl" />
                      </div>
                      {orderData.windowType === "cam-balkon" && measurement.deductSashAllowance && measurement.width && (
                        <div className="rounded-lg bg-secondary/10 px-3 py-2 text-right text-xs">
                          <span className="text-muted-foreground">Net üretim genişliği</span>
                          <strong className="ml-2 text-secondary">{getNetWidth(measurement)} cm</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {totalPrice > 0 && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tahmini Toplam</span>
                    <span className="text-lg font-bold text-primary">{totalPrice.toFixed(2)} ₺</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Delivery */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ad Soyad</Label>
                  <Input value={orderData.customerName} onChange={(e) => setOrderData({ ...orderData, customerName: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={orderData.customerPhone} onChange={(e) => setOrderData({ ...orderData, customerPhone: e.target.value })} className="rounded-xl" placeholder="05XX XXX XXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Şehir</Label>
                <Input value={orderData.customerCity} onChange={(e) => setOrderData({ ...orderData, customerCity: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Textarea value={orderData.customerAddress} onChange={(e) => setOrderData({ ...orderData, customerAddress: e.target.value })} className="rounded-xl" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Not (Opsiyonel)</Label>
                <Textarea value={orderData.customerNote} onChange={(e) => setOrderData({ ...orderData, customerNote: e.target.value })} className="rounded-xl" rows={2} placeholder="Varsa eklemek istediğiniz not..." />
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-serif font-bold">Siparişiniz Alındı!</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Siparişiniz başarıyla oluşturuldu. Giriş yaptıysanız sipariş durumunuzu Hesabım sayfasından takip edebilirsiniz.
              </p>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 1} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Geri
              </Button>
              {step < 3 ? (
                <Button onClick={goForward} className="gap-2 btn-premium">
                  İleri <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={createOrderMutation.isPending || !canContinue} className="gap-2 btn-premium">
                  {createOrderMutation.isPending ? "Gönderiliyor..." : "Siparişi Onayla"}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
