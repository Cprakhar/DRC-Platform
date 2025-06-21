import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface Props {
  position: [number, number];
  open: boolean;
}

const SelectedMarkerPopupOpener: React.FC<Props> = ({ position, open }) => {
  const map = useMap();
  useEffect(() => {
    if (open) {
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          const { lat, lng } = layer.getLatLng();
          // Use toFixed for float comparison tolerance
          if (lat.toFixed(6) === position[0].toFixed(6) && lng.toFixed(6) === position[1].toFixed(6)) {
            layer.openPopup();
          }
        }
      });
    }
  }, [open, position, map]);
  return null;
};

export default SelectedMarkerPopupOpener;
