import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { getDeal } from "../dealStore";

type Deal = {
  id: string;
  name: string;
  location: string;
  roomTypes: Array<{ rooms: number }>;
  purchasePrice: number;
  currency: string;
  roomRevenue?: any;
  fnbRevenue?: any;
  otherRevenue?: any;
  payrollModel?: any;
  budget?: any;
  assumptions?: any;
  amenities?: any;
  // add any other fields you actually use
};

export function useActiveDeal(explicitDealId?: string) {
  const params = useParams<{ id?: string; dealId?: string }>();
  const dealId = explicitDealId ?? params.id ?? params.dealId ?? null;

  const deal: Deal | undefined = useMemo(() => {
    if (!dealId) return undefined;
    return getDeal(dealId) as Deal | undefined;
  }, [dealId]);

  const status: "ready" | "missingId" | "notFound" =
    !dealId ? "missingId" : !deal ? "notFound" : "ready";

  return { dealId, deal, status };
}