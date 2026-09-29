import { ButtonLink } from '../components/ui/Button'
import { ErrorView } from '../components/ui/StateView'

export function NotFoundPage() {
  return (
    <ErrorView
      title="Хуудас олдсонгүй"
      message="Таны хайсан хуудас байхгүй эсвэл зөөгдсөн байна."
      action={<ButtonLink to="/">Нүүр хуудас руу буцах</ButtonLink>}
    />
  )
}
