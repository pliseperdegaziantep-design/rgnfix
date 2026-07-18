import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ShoppingCart,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  LogIn,
  Plus,
  Trash2,
  DoorOpen,
  PackageSearch,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CASE_TYPES, MOUNT_TYPES, PROFILE_COLORS, WINDOW_TYPES } from "@shared/types";
import { toast } from "sonner";

type MeasurementRow = {
  id: string;
  width: string;
  height: string;
  quantity: string;
  deductSashAllowance: boolean;
  sashAllowance: string;
};

const emptyMeasurement = (id: string): MeasurementRow => ({
  id,
  width: "",
  height: "",
  quantity: "1",
  deductSashAllowance: false,
  sashAllowance: "2",
});

export default function OrderPage() {
  const { isAuthenticated, user } = useAuth();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const initialSeriesSlug = params.get("series");
  const { data: fabrics } = trpc.fabrics.list.useQuery();

  const [step, setStep] = useState(1);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");
  const [measurements, setMeasurements] = useState<MeasurementRow[]>([
    {
      ...emptyMeasurement("1"),
      width: params.get("width") || "",
      height: params.get("height") || "",
      quantity: params.get("count") || "1",
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
  const selectedFabric = fabrics?.find(fabric => fabric.id.toString() === orderData.fabricId);
  const availableProfileColors = orderData.caseType === "slim"
    ? PROFILE_COLORS.filter(color => color.id === "beyaz" || color.id === "antrasit")
    : PROFILE_COLORS;

  useEffect(() => {
    if (!initialSeriesSlug || orderData.fabricId || !fabrics?.length) return;
    const matchedFabric = fabrics.find(fabric => fabric.slug === initialSeriesSlug);
    if (matchedFabric) {
      setOrderData(current => ({ ...current, fabricId: matchedFabric.id.toString() }));
    }
  }, [fabrics, initialSeriesSlug, orderData.fabricId]);

  useEffect(() => {
    if (!user || user.role !== "user") return;
    setOrderData(current => ({
      ...current,
      customerName: current.customerName || user.name || "",
      customerPhone: current.customerPhone || user.phone || "",
      customerAddress: current.customerAddress || user.address || "",
      customerCity: current.customerCity || user.city || "",
    }));
  }, [user]);

  const roundTo5 = (value: number) => Math.ceil(value / 5) * 5;
  const getNetWidth = (measurement: MeasurementRow) => {
    const width = parseFloat(measurement.width) || 0;
    const allowance = orderData.windowType === "cam-balkon" && measurement.deductSashAllowance
      ? parseFloat(measurement.sashAllowance) || 0
      : 0;
    return Math.max(width - allowance, 0);
  };

  const updateMeasurement = (id: string, patch: Partial<MeasurementRow>) => {
    setMeasurements(current => current.map(measurement => measurement.id === id ? { ...measurement, ...patch } : measurement));
  };

  const addMeasurement = () => {
    const nextId = String(Math.max(...measurements.map(measurement => Number(measurement.id)), 0) + 1);
    setMeasurements(current => [...current, emptyMeasurement(nextId)]);
  };

  const removeMeasurement = (id: string) => {
    setMeasurements(current => current.length > 1 ? current.filter(measurement => measurement.id !== id) : current);
  };

  const totalPrice = useMemo(() => {
    if (!selectedFabric) return 0;
    const caseSurcharge = CASE_TYPES.find(item => item.id === orderData.caseType)?.surchargePerSqm || 0;
    const unitPrice = parseFloat(selectedFabric.pricePerSqm) + caseSurcharge;

    return measurements.reduce((total, measurement) => {
      const netWidth = getNetWidth(measurement);
      const height = parseFloat(measurement.height) || 0;
      if (netWidth <= 0 || height <= 0) return total;
      const area = Math.max((roundTo5(netWidth) * roundTo5(height)) / 10000, 1);
      return total + area * unitPrice * (parseInt(measurement.quantity, 10) || 1);
    }, 0);
  }, [selectedFabric, measurements, orderData.caseType, orderData.windowType]);

  const canContinue = useMemo(() => {
    if (step === 1) {
      return Boolean(orderData.fabricId && orderData.windowType && orderData.profileColor && orderData.mountType && orderData.caseType);
    }
    if (step === 2) {
      return measurements.length > 0 && measurements.every(measurement =>
        getNetWidth(measurement) > 0 && parseFloat(measurement.height) > 0 && parseInt(measurement.quantity, 10) > 0
      );
    }
    if (step === 3) {
      return Boolean(
        orderData.customerName.trim() &&
        orderData.customerPhone.trim() &&
        orderData.customerCity.trim() &&
        orderData.customerAddress.trim()
      );
    }
    return true;
  }, [orderData, step, measurements]);

  const goForward = () => {
    if (!canContinue) {
      toast.error("Devam etmek için zorunlu alanları eksiksiz doldurun.");
      return;
    }
    setStep(current => current + 1);
  };

  const handleSubmit = async () => {
    try {
      const firstMeasurement = measurements[0];
      const totalQuantity = measurements.reduce(
        (total, measurement) => total + (parseInt(measurement.quantity, 10) || 1),
        0
      );
      const measurementSummary = measurements.map((measurement, index) => {
        const allowanceText = orderData.windowType === "cam-balkon" && measurement.deductSashAllowance
          ? `, açılır kanat payı -${measurement.sashAllowance} cm`
          : "";
        return `${index + 1}. ölçü: ${measurement.width} × ${measurement.height} cm, net genişlik ${getNetWidth(measurement)} cm, ${measurement.quantity} adet${allowanceText}`;
      }).join("\n");

      const result = await createOrderMutation.mutateAsync({
        fabricId: parseInt(orderData.fabricId, 10),
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
          `Uygulama alanı: ${WINDOW_TYPES.find(type => type.id === orderData.windowType)?.name || orderData.windowType}`,
          "Ölçü detayları:",
          measurementSummary,
        ].filter(Boolean).join("\n"),
      });

      setCreatedOrderNumber(result.orderNumber);
      setStep(4);
      toast.success(`Siparişiniz oluşturuldu. Numaranız: ${result.orderNumber}`);
    } catch (error) {
      console.error(error);
      toast.error("Sipariş oluşturulurken bir hata oluştu.");
    }
  };

  return (
    <div className="container py-8 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <ShoppingCart className="h-3.5 w-3.5" /> Online Sipariş
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Sipariş Oluştur</h1>
        <p className="text-sm text-muted-foreground">Ölçülerinizi girin, ürününüz size özel hazırlansın.</p>
      </div>

      {!isAuthenticated && step < 4 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <LogIn className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Siparişinizi hesabınıza kaydedin</p>
                <p className="text-xs text-muted-foreground">Giriş yaparsanız siparişi takip edebilir ve 24 saat içinde iptal edebilirsiniz.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => startLogin()} className="rounded-lg gap-2">
              <LogIn className="h-4 w-4" /> Giriş Yap / Kayıt Ol
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-2 mb-8">
        {["Ürün Seçimi", "Ölçüler", "Teslimat", "Onay"].map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step > index + 1
                ? "bg-primary text-primary-foreground"
                : step === index + 1
                  ? "bg-primary/10 text-primary border-2 border-primary"
                  : "bg-muted text-muted-foreground"
            }`}>
              {step > index + 1 ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            {index < 3 && <div className={`w-6 h-0.5 ${step > index + 1 ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Kumaş Tipi</Label>
                <Select value={orderData.fabricId} onValueChange={value => setOrderData({ ...orderData, fabricId: value })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Kumaş seçin" /></SelectTrigger>
                  <SelectContent>
                    {fabrics?.map(fabric => (
                      <SelectItem key={fabric.id} value={fabric.id.toString()}>{fabric.name} - {fabric.pricePerSqm} ₺/m²</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Uygulama Alanı</Label>
                <Select
                  value={orderData.windowType}
                  onValueChange={value => {
                    setOrderData({ ...orderData, windowType: value });
                    if (value !== "cam-balkon") {
                      setMeasurements(current => current.map(measurement => ({ ...measurement, deductSashAllowance: false })));
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Uygulama alanını seçin" /></SelectTrigger>
                  <SelectContent>
                    {WINDOW_TYPES.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Profil Rengi</Label>
                <Select value={orderData.profileColor} onValueChange={value => setOrderData({ ...orderData, profileColor: value })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Profil rengi seçin" /></SelectTrigger>
                  <SelectContent>
                    {availableProfileColors.map(color => <SelectItem key={color.id} value={color.id}>{color.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Montaj Tipi</Label>
                <Select value={orderData.mountType} onValueChange={value => setOrderData({ ...orderData, mountType: value })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Montaj tipi seçin" /></SelectTrigger>
                  <SelectContent>
                    {MOUNT_TYPES.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kasa Tipi</Label>
                <Select
                  value={orderData.caseType}
                  onValueChange={value => {
                    const nextCase = value === "slim" ? "slim" : "kalin";
                    const profileAllowed = nextCase === "kalin" || orderData.profileColor === "beyaz" || orderData.profileColor === "antrasit";
                    setOrderData({ ...orderData, caseType: nextCase, profileColor: profileAllowed ? orderData.profileColor : "" });
                  }}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Kasa tipi seçin" /></SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}{item.surchargePerSqm ? ` (+${item.surchargePerSqm} ₺/m²)` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div><h3 className="font-semibold">Pencere Ölçüleri</h3><p className="text-xs text-muted-foreground">Her farklı pencere için ayrı ölçü ekleyebilirsiniz.</p></div>
                <Button type="button" variant="outline" size="sm" onClick={addMeasurement} className="shrink-0 gap-2 rounded-xl"><Plus className="h-4 w-4" /> Ölçü Ekle</Button>
              </div>

              <div className="space-y-4">
                {measurements.map((measurement, index) => (
                  <div key={measurement.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <strong className="text-sm">Ölçü {index + 1}</strong>
                      {measurements.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeMeasurement(measurement.id)} className="h-8 gap-1.5 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Kaldır</Button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Genişlik (cm)</Label><Input type="number" min="1" value={measurement.width} onChange={event => updateMeasurement(measurement.id, { width: event.target.value })} className="rounded-xl" /></div>
                      <div className="space-y-2"><Label>Yükseklik (cm)</Label><Input type="number" min="1" value={measurement.height} onChange={event => updateMeasurement(measurement.id, { height: event.target.value })} className="rounded-xl" /></div>
                    </div>

                    {orderData.windowType === "cam-balkon" && (
                      <div className="mt-4 flex flex-col gap-4 rounded-xl border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Switch id={`sash-${measurement.id}`} checked={measurement.deductSashAllowance} onCheckedChange={checked => updateMeasurement(measurement.id, { deductSashAllowance: checked })} />
                          <Label htmlFor={`sash-${measurement.id}`} className="cursor-pointer">
                            <span className="flex items-center gap-2"><DoorOpen className="h-4 w-4 text-secondary" /> Açılır kanat payını düş</span>
                            <span className="mt-1 block text-xs font-normal text-muted-foreground">Genişlikten varsayılan 2 cm düşülür.</span>
                          </Label>
                        </div>
                        {measurement.deductSashAllowance && (
                          <div className="flex items-center gap-2"><Input type="number" min="0" step="0.5" value={measurement.sashAllowance} onChange={event => updateMeasurement(measurement.id, { sashAllowance: event.target.value })} className="h-9 w-20 rounded-lg" /><span className="text-xs text-muted-foreground">cm</span></div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div className="space-y-2"><Label>Adet</Label><Input type="number" min="1" value={measurement.quantity} onChange={event => updateMeasurement(measurement.id, { quantity: event.target.value })} className="w-24 rounded-xl" /></div>
                      {orderData.windowType === "cam-balkon" && measurement.deductSashAllowance && measurement.width && (
                        <div className="rounded-lg bg-secondary/10 px-3 py-2 text-right text-xs"><span className="text-muted-foreground">Net üretim genişliği</span><strong className="ml-2 text-secondary">{getNetWidth(measurement)} cm</strong></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalPrice > 0 && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center"><span className="text-sm font-medium">Tahmini Toplam</span><span className="text-lg font-bold text-primary">{totalPrice.toFixed(2)} ₺</span></div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Ad Soyad</Label><Input value={orderData.customerName} onChange={event => setOrderData({ ...orderData, customerName: event.target.value })} className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Telefon</Label><Input value={orderData.customerPhone} onChange={event => setOrderData({ ...orderData, customerPhone: event.target.value })} className="rounded-xl" placeholder="05XX XXX XXXX" /></div>
              </div>
              <div className="space-y-2"><Label>Şehir</Label><Input value={orderData.customerCity} onChange={event => setOrderData({ ...orderData, customerCity: event.target.value })} className="rounded-xl" /></div>
              <div className="space-y-2"><Label>Adres</Label><Textarea value={orderData.customerAddress} onChange={event => setOrderData({ ...orderData, customerAddress: event.target.value })} className="rounded-xl" rows={3} /></div>
              <div className="space-y-2"><Label>Not (Opsiyonel)</Label><Textarea value={orderData.customerNote} onChange={event => setOrderData({ ...orderData, customerNote: event.target.value })} className="rounded-xl" rows={2} /></div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto"><CheckCircle2 className="h-8 w-8 text-green-600" /></div>
              <div><h3 className="text-xl font-serif font-bold">Siparişiniz Alındı!</h3><p className="mt-2 text-muted-foreground text-sm">Sipariş numaranızı saklayın.</p></div>
              <div className="mx-auto max-w-xs rounded-2xl border border-primary/20 bg-primary/5 p-5"><span className="text-xs uppercase tracking-wider text-muted-foreground">Sipariş Numarası</span><strong className="mt-2 block text-4xl tracking-[0.18em] text-primary">{createdOrderNumber}</strong></div>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                {isAuthenticated ? (
                  <Link href={user?.role === "admin" ? "/yonetici" : "/hesabim"}><Button className="gap-2"><PackageSearch className="h-4 w-4" /> Siparişi Takip Et</Button></Link>
                ) : (
                  <Button onClick={() => startLogin()} className="gap-2"><LogIn className="h-4 w-4" /> Kayıt Ol ve Takip Et</Button>
                )}
                <Button variant="outline" onClick={() => window.location.reload()}>Yeni Sipariş Oluştur</Button>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="flex justify-between pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 1} className="gap-2"><ArrowLeft className="h-4 w-4" /> Geri</Button>
              {step < 3 ? (
                <Button onClick={goForward} className="gap-2 btn-premium">İleri <ArrowRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={handleSubmit} disabled={createOrderMutation.isPending || !canContinue} className="gap-2 btn-premium">
                  {createOrderMutation.isPending ? "Gönderiliyor..." : "Siparişi Onayla"}<CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
