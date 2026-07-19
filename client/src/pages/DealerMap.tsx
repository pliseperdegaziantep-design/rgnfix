import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, MessageCircle, Navigation, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";

export default function DealerMap() {
  const { data: dealers, isLoading } = trpc.dealers.list.useQuery();
  const [searchCity, setSearchCity] = useState("");

  const filteredDealers = dealers?.filter(
    (d) =>
      !searchCity ||
      d.city?.toLowerCase().includes(searchCity.toLowerCase()) ||
      d.district?.toLowerCase().includes(searchCity.toLowerCase()) ||
      d.name?.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <MapPin className="h-3.5 w-3.5" />
          Bayi Ağı
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">
          Bayi Haritası
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Size en yakın RGNFIX çözüm noktasını bulun
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Şehir veya ilçe ara..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[500px]">
                <MapView
                  onMapReady={(map) => {
                    if (dealers && dealers.length > 0) {
                      const bounds = new google.maps.LatLngBounds();
                      dealers.forEach((dealer) => {
                        if (dealer.lat && dealer.lng) {
                          const pos = { lat: parseFloat(dealer.lat), lng: parseFloat(dealer.lng) };
                          bounds.extend(pos);
                          const marker = new google.maps.Marker({
                            position: pos,
                            map,
                            title: dealer.name,
                          });
                          const infoWindow = new google.maps.InfoWindow({
                            content: `<div style="padding:8px"><strong>${dealer.name}</strong><br/>${dealer.address || ""}<br/>${dealer.phone || ""}</div>`,
                          });
                          marker.addListener("click", () => infoWindow.open(map, marker));
                        }
                      });
                      map.fitBounds(bounds);
                    } else {
                      map.setCenter({ lat: 39.0, lng: 35.0 });
                      map.setZoom(6);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dealer List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))
          ) : filteredDealers && filteredDealers.length > 0 ? (
            filteredDealers.map((dealer) => (
              <Card key={dealer.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm">{dealer.name}</h3>
                  <p className="text-xs text-muted-foreground">{dealer.address}</p>
                  <p className="text-xs text-muted-foreground">{dealer.city} / {dealer.district}</p>
                  <div className="flex gap-2 pt-1">
                    {dealer.phone && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" asChild>
                        <a href={`tel:${dealer.phone}`}>
                          <Phone className="h-3 w-3" /> Ara
                        </a>
                      </Button>
                    )}
                    {dealer.whatsapp && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" asChild>
                        <a href={`https://wa.me/${dealer.whatsapp}`} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </a>
                      </Button>
                    )}
                    {dealer.lat && dealer.lng && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" asChild>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${dealer.lat},${dealer.lng}`} target="_blank" rel="noopener noreferrer">
                          <Navigation className="h-3 w-3" /> Yol Tarifi
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Bayi bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
