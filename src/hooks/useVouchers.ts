import { useEffect, useState } from "react";

/* localStorage key (절대 변경 ❌) */
const LS_VOUCHERS = "tripmoa_vouchers";

export type VoucherType = "AIR" | "HTL" | "TKT" | "ETC";

export interface VoucherItem {
  id: number;
  type: VoucherType;
  icon: string;
  title: string;
  desc: string;
  meta: string;
  fileData: string | null; // base64
  fileType: "pdf" | "jpg" | "img";
}

const safeParse = (raw: string | null): VoucherItem[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as VoucherItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const useVouchers = () => {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);

  /* load */
  useEffect(() => {
    setVouchers(safeParse(localStorage.getItem(LS_VOUCHERS)));
  }, []);

  /* persist */
  useEffect(() => {
    localStorage.setItem(LS_VOUCHERS, JSON.stringify(vouchers));
  }, [vouchers]);

  const addVoucher = (item: VoucherItem) => {
    setVouchers((prev) => [...prev, item]);
  };

  const deleteVoucher = (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setVouchers((prev) => prev.filter((v) => v.id !== id));
  };

  const downloadVoucher = (id: number) => {
    const target = vouchers.find((v) => v.id === id);
    if (!target || !target.fileData) {
      alert("첨부된 파일이 없습니다.");
      return;
    }

    const link = document.createElement("a");
    link.href = target.fileData;
    link.download = `${target.title}.${target.fileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    vouchers,
    addVoucher,
    deleteVoucher,
    downloadVoucher,
  };
};
