export interface UserData {
  id: string;
  name: string;
  position: string;
}

export const USER_DATABASE: Record<string, UserData> = {
  Artanti: {
    id: "KT001",
    name: "Artanti Najwa Salsabila",
    position: "Ketua",
  },
  Reivantoro: {
    id: "KT002",
    name: "Reivantoro",
    position: "Wakil Ketua Internal",
  },
  Muhamad: {
    id: "KT003",
    name: "Muhamad Risqi Febriano",
    position: "Wakil Ketua Eksternal",
  },
  Dicce: {
    id: "KT004",
    name: "Dicce Queen Malika",
    position: "Sekretaris 1",
  },
  Mutiara: {
    id: "KT005",
    name: "Mutiara Eka Krisnawati",
    position: "Sekretaris 2",
  },
  Emilia: {
    id: "KT006",
    name: "Emilia Rahmawati",
    position: "Bendahara",
  },
  Helmi: {
    id: "KT007",
    name: "Helmi Fauzi Ahmad",
    position: "Bidang Organisasi 1",
  },
  Almira: {
    id: "KT008",
    name: "Almira Eka Sutrisno",
    position: "Bidang Organisasi 2",
  },
  Widia: {
    id: "KT009",
    name: "Widia Lailatul Annisa",
    position: "Bidang SDM & IPTEK 1",
  },
  Azzahratunnisa: {
    id: "KT010",
    name: "Azzahratunnisa Erdiansyah",
    position: "Bidang SDM & IPTEK 2",
  },
  Dhavin: {
    id: "KT011",
    name: "Dhavin Fasya Alviyanto",
    position: "Bidang SDM & IPTEK 3",
  },
  Alif: {
    id: "KT012",
    name: "Muhammad Alif Erdiansyah",
    position: "Bidang Seni Budaya",
  },
  Dimas: {
    id: "KT013",
    name: "Dimas Seno Putra Budiyono",
    position: "Bidang Pendidikan",
  },
  Dewanta: {
    id: "KT014",
    name: "Dewanta Artari Putra",
    position: "Bidang Ekonomi",
  },
  Anneke: {
    id: "KT015",
    name: "Anneke Fidelina Sigarlaki",
    position: "Bidang Sosial",
  },
};

export const TM_MODEL_URL = process.env.NEXT_PUBLIC_TM_MODEL_URL;
