type ClothingItem = {
  id: number;
  image: string;
  description: string;
  brand: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessories';
};

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Profile: undefined;
  Clothes: undefined;
  OutfitResult: {
    selectedItems: ClothingItem[];
  };
};
