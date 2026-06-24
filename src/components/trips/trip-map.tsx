"use client";

import { useCallback, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
} from "@react-google-maps/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DayItinerary } from "@/types/trip";
import { AlertCircle, Map, MapPin } from "lucide-react";

interface TripMapProps {
  days: DayItinerary[];
  destination: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "420px",
};

const defaultCenter = { lat: 37.5665, lng: 126.978 };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

export function TripMap({ days, destination }: TripMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "tripmind-google-map",
    googleMapsApiKey: apiKey,
  });

  const markers = useMemo(() => {
    return days.flatMap((day) =>
      day.places
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({
          name: p.name,
          position: { lat: p.lat!, lng: p.lng! },
        }))
    );
  }, [days]);

  const center = markers[0]?.position ?? defaultCenter;
  const zoom = markers.length <= 1 ? 13 : 12;

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (markers.length < 2 || !window.google?.maps?.LatLngBounds) return;

      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((marker) => bounds.extend(marker.position));
      map.fitBounds(bounds, 48);
    },
    [markers]
  );

  if (!apiKey) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy)]/5">
              <Map className="h-5 w-5 text-[var(--accent-dark)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--navy)]">
                {destination} 지도
              </h3>
              <p className="text-xs text-[var(--muted)]">Google Maps Platform</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--background)] text-center">
            <MapPin className="h-8 w-8 text-[var(--muted)]/65" />
            <p className="text-sm text-[var(--muted)]">
              Google Maps API 키를 설정하면
              <br />
              추천 장소가 지도에 표시됩니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="text-lg font-semibold text-[var(--navy)]">
                {destination} 지도
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Google Maps를 불러오지 못했습니다
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted)]">
            Maps JavaScript API 활성화 및 API 키 제한(HTTP 리퍼러) 설정을
            확인해주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            Google Maps 로딩 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy)]/5">
            <Map className="h-5 w-5 text-[var(--accent-dark)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--navy)]">
              {destination} 지도
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Google Maps · {markers.length}개 장소
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-0">
        <div className="overflow-hidden rounded-b-2xl">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={zoom}
            options={mapOptions}
            onLoad={onMapLoad}
          >
            {markers.map((marker, idx) => (
              <Marker
                key={`${marker.position.lat}-${marker.position.lng}-${marker.name}`}
                position={marker.position}
                title={marker.name}
                label={{ text: String(idx + 1), color: "white" }}
              />
            ))}
          </GoogleMap>
        </div>
        {markers.length === 0 && (
          <p className="px-6 py-4 text-sm text-[var(--muted)]">
            일정에 좌표가 포함된 장소가 없어 기본 위치를 표시합니다. AI 일정을
            다시 생성하면 지도에 표시될 수 있습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
