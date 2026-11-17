type LocalisedText = { en: string; te: string };

type ShopDetails = {
  address: LocalisedText | null;
  location: {
    latitude: number;
    longitude: number;
    mapsUrl: string;
    directionsUrl: string;
    embedUrl: string;
  };
  openingHours: LocalisedText | null;
  deliveryAreas: LocalisedText | null;
  deliveryTerms: LocalisedText | null;
};

// Add only owner-confirmed information. Empty values show an enquiry link.
export const SHOP_DETAILS: ShopDetails = {
  address: {
    en: "Gandhi Bomma Centre, Vadlapudi\nVisakhapatnam, Andhra Pradesh – 530046",
    te: "గాంధీ బొమ్మ సెంటర్, వడ్లపూడి\nవిశాఖపట్నం, ఆంధ్రప్రదేశ్ – 530046",
  },
  location: {
    latitude: 17.694756,
    longitude: 83.172180,
    mapsUrl: "https://maps.google.com/?q=17.694756,83.172180",
    directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=17.694756%2C83.172180",
    embedUrl: "https://maps.google.com/maps?q=17.694756%2C83.172180&z=16&output=embed",
  },
  openingHours: null,
  deliveryAreas: null,
  deliveryTerms: null,
};
