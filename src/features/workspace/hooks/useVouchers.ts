// src/features/workspace/hooks/useVouchers.ts

import { useCallback, useEffect, useState } from "react";
import {
  createVoucher,
  deleteVoucher,
  getVoucher,
  getVouchers,
  updateVoucher,
} from "../../../api/voucher.api";
import type {
  VoucherCreateRequest,
  VoucherResponse,
  VoucherUpdateRequest,
} from "../../../types/voucher.types";
import { useTripContext } from "./useTripContext";
import { API_BASE_URL } from "../../../shared/config/env";

const buildFileUrl = (fileUrl: string) => {
  if (!fileUrl) return "";

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  const apiBaseUrl = API_BASE_URL ?? "";
  return `${apiBaseUrl}${fileUrl}`;
};

export const useVouchers = () => {
  const { tripId } = useTripContext();

  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVouchers = useCallback(async () => {
    if (!Number.isFinite(tripId) || tripId <= 0) {
      setVouchers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await getVouchers(tripId);
      setVouchers(response.data);
    } catch (error) {
      console.error("바우처 목록 조회 실패:", error);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const addVoucher = async (request: VoucherCreateRequest, file: File) => {
    if (!Number.isFinite(tripId) || tripId <= 0) {
      throw new Error("유효한 여행 정보가 없습니다.");
    }

    try {
      const response = await createVoucher(tripId, request, file);
      setVouchers((prev) => [response.data, ...prev]);
      return response.data;
    } catch (error) {
      console.error("바우처 등록 실패:", error);
      throw error;
    }
  };

  const editVoucher = async (
    voucherId: number,
    request: VoucherUpdateRequest,
    file?: File,
  ) => {
    if (!Number.isFinite(tripId) || tripId <= 0) {
      throw new Error("유효한 여행 정보가 없습니다.");
    }

    try {
      const response = await updateVoucher(tripId, voucherId, request, file);

      setVouchers((prev) =>
        prev.map((voucher) =>
          voucher.voucherId === voucherId ? response.data : voucher,
        ),
      );

      return response.data;
    } catch (error) {
      console.error("바우처 수정 실패:", error);
      throw error;
    }
  };

  const removeVoucher = async (voucherId: number) => {
    if (!Number.isFinite(tripId) || tripId <= 0) {
      throw new Error("유효한 여행 정보가 없습니다.");
    }

    try {
      await deleteVoucher(tripId, voucherId);
      setVouchers((prev) =>
        prev.filter((voucher) => voucher.voucherId !== voucherId),
      );
    } catch (error) {
      console.error("바우처 삭제 실패:", error);
      throw error;
    }
  };

  const downloadVoucherFile = async (voucherId: number) => {
    try {
      const target = vouchers.find(
        (voucher) => voucher.voucherId === voucherId,
      );

      if (!target?.fileUrl) {
        throw new Error("첨부된 파일이 없습니다.");
      }

      const link = document.createElement("a");
      link.href = buildFileUrl(target.fileUrl);
      link.download = target.fileName || "voucher-file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("바우처 다운로드 실패:", error);
      throw error;
    }
  };

  const previewVoucherFile = async (voucherId: number) => {
    try {
      const target = vouchers.find(
        (voucher) => voucher.voucherId === voucherId,
      );

      if (!target?.fileUrl) {
        throw new Error("첨부된 파일이 없습니다.");
      }

      window.open(
        buildFileUrl(target.fileUrl),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      console.error("바우처 미리보기 실패:", error);
      throw error;
    }
  };

  const fetchVoucherDetail = async (voucherId: number) => {
    if (!Number.isFinite(tripId) || tripId <= 0) {
      throw new Error("유효한 여행 정보가 없습니다.");
    }

    try {
      const response = await getVoucher(tripId, voucherId);
      return response.data;
    } catch (error) {
      console.error("바우처 상세 조회 실패:", error);
      throw error;
    }
  };

  return {
    vouchers,
    loading,
    fetchVouchers,
    fetchVoucherDetail,
    addVoucher,
    editVoucher,
    deleteVoucher: removeVoucher,
    downloadVoucher: downloadVoucherFile,
    previewVoucher: previewVoucherFile,
  };
};
