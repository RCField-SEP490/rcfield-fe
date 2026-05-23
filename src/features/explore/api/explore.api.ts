import { mockCafes, type Cafe, type CafeSearchParams } from "@/shared/data/explore-data"

export async function getCafes(params: CafeSearchParams = {}): Promise<Cafe[]> {
  void params
  return Promise.resolve(mockCafes)
}
