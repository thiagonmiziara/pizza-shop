import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  GetManagedRestaurant,
  getManagedRestaurant,
} from '@/api/get-managed-restaurant'
import { updateProfile } from '@/api/update-profile'

import { Button } from './ui/button'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

const storeProfileSchema = z.object({
  name: z.string().min(3),
  description: z.string().nullable(),
})

type SoreProfileSchema = z.infer<typeof storeProfileSchema>

export function StoreProfileDialog() {
  const queryClient = useQueryClient()

  const { data: managedRestaurant } = useQuery({
    queryKey: ['managed-restaurant'],
    queryFn: getManagedRestaurant,
    staleTime: Infinity,
  })

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SoreProfileSchema>({
    resolver: zodResolver(storeProfileSchema),
    values: {
      name: managedRestaurant?.name ?? '',
      description: managedRestaurant?.description ?? '',
    },
  })

  // Update the cached managed restaurant data with the provided information.
  function updateManagedRestaurantCached(data: SoreProfileSchema) {
    const { name, description } = data
    const cached = queryClient.getQueryData<GetManagedRestaurant>([
      'managed-restaurant',
    ])

    if (cached) {
      queryClient.setQueryData<GetManagedRestaurant>(['managed-restaurant'], {
        ...cached,
        name,
        description,
      })
    }

    return { cached }
  }

  const { mutateAsync: updateProfileFn } = useMutation({
    mutationFn: updateProfile,
    onMutate: ({ name, description }) => {
      const { cached } = updateManagedRestaurantCached({ name, description })

      return { previousProfile: cached }
    },
    onError: (_, __, context) => {
      if (context?.previousProfile) {
        updateManagedRestaurantCached(context.previousProfile)
      }
    },
  })

  async function handleUpdateProfile(data: SoreProfileSchema) {
    try {
      await updateProfileFn({
        name: data.name,
        description: data.description,
      })

      toast.success('Perfil atualizado com sucesso!')
    } catch {
      toast.error('Falha ao atualizar perfil, tente novamente!')
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Perfil da loja</DialogTitle>
        <DialogDescription>
          Atualize as informações do seu estabelecimento visíveis ao seu cliente
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleUpdateProfile)}>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="name">
              Nome
            </Label>
            <Input id="name" className="col-span-3" {...register('name')} />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="description">
              Descrição
            </Label>
            <Textarea
              id="description"
              className="col-span-3"
              {...register('description')}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button variant="success" type="submit" disabled={isSubmitting}>
            Salvar
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
