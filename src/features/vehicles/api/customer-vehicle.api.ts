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

export const customerVehicleApi = {
  list: async (): Promise<CustomerVehicle[]> => {
    const res = await api.get<ApiResponse<any[]>>("/v1/me/customer-vehicles")
    return res.data.data.map(item => ({
      id: item.id,
      customerId: item.customer_id,
      name: item.name,
      scale: item.scale,
      chassisType: item.chassis_type,
      frequency: item.frequency,
      status: item.status,
      imageUrl: item.image_url,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
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
    const item = res.data.data
    return {
      id: item.id,
      customerId: item.customer_id,
      name: item.name,
      scale: item.scale,
      chassisType: item.chassis_type,
      frequency: item.frequency,
      status: item.status,
      imageUrl: item.image_url,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }
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
    const item = res.data.data
    return {
      id: item.id,
      customerId: item.customer_id,
      name: item.name,
      scale: item.scale,
      chassisType: item.chassis_type,
      frequency: item.frequency,
      status: item.status,
      imageUrl: item.image_url,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/v1/me/customer-vehicles/${id}`)
  },
}
