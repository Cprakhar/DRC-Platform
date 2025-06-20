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
        if (layer instanceof L.Marker && layer.getLatLng().lat === position[0] && layer.getLatLng().lng === position[1]) {
          layer.openPopup();
        }
      });
    }
  }, [open, position, map]);
  return null;
};

export default SelectedMarkerPopupOpener;
