import { api } from "@/shared/lib/axios"

export interface CustomerVehicle {
  id: string
  customerId: string
  name: string
  scale: string
  chassisType: string
  frequency: string
  status: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerVehicleDto {
  name: string
  scale: string
  chassisType: string
  frequency: string
  imageUrl?: string
}

export interface UpdateCustomerVehicleDto {
  name?: string
  scale?: string
  chassisType?: string
  frequency?: string
  status?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

const mapCustomerVehicle = (item: any): CustomerVehicle => ({
  id: item.id,
  customerId: item.customer_id ?? item.customerId,
  name: item.name,
  scale: item.scale,
  chassisType: item.chassis_type ?? item.chassisType,
  frequency: item.frequency,
  status: item.status ?? "ACTIVE",
  imageUrl: item.image_url ?? item.imageUrl,
  createdAt: item.created_at ?? item.createdAt,
  updatedAt: item.updated_at ?? item.updatedAt,
})

export const customerVehicleApi = {
  list: async (): Promise<CustomerVehicle[]> => {
    const res = await api.get<ApiResponse<any[]>>("/v1/me/customer-vehicles")
    return res.data.data.map(mapCustomerVehicle)
  },

  create: async (data: CreateCustomerVehicleDto): Promise<CustomerVehicle> => {
    const payload = {
      name: data.name,
      scale: data.scale,
      chassis_type: data.chassisType,
      frequency: data.frequency,
      image_url: data.imageUrl || null,
    }
    const res = await api.post<ApiResponse<any>>("/v1/me/customer-vehicles", payload)
    return mapCustomerVehicle(res.data.data)
  },

  update: async (id: string, data: UpdateCustomerVehicleDto): Promise<CustomerVehicle> => {
    const payload = {
      name: data.name,
      scale: data.scale,
      chassis_type: data.chassisType,
      frequency: data.frequency,
      status: data.status,
    }
    const res = await api.patch<ApiResponse<any>>(`/v1/me/customer-vehicles/${id}`, payload)
    return mapCustomerVehicle(res.data.data)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/v1/me/customer-vehicles/${id}`)
  },
}
