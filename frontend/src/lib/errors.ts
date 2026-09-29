import { ApiError } from './api'

/** Friendly Mongolian messages for API failures — raw errors are never shown. */
export function friendlyError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Алдаа гарлаа. Дахин оролдоно уу.'

  if (error.isNetwork) return 'Интернэт холболтоо шалгаад дахин оролдоно уу.'

  switch (error.code) {
    case 'not_found':
      return 'Энэ шалгалт олдсонгүй. Холбоос буруу эсвэл устгагдсан байж магадгүй.'
    case 'payment_provider_unavailable':
      return 'QPay түр ажиллахгүй байна. Хэдэн минутын дараа дахин оролдоно уу.'
    case 'payment_required':
      return 'Төлбөр баталгаажаагүй байна.'
    case 'rate_limited':
      return 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.'
    case 'report_generation_failed':
      return 'Тайлан үүсгэх үед алдаа гарлаа. Таны төлбөр хадгалагдсан тул дахин оролдох боломжтой.'
    case 'generation_limit_reached':
      return 'Тайлан үүсгэж чадсангүй. Таны төлбөр хадгалагдсан — бидэнтэй холбогдоно уу.'
    case 'validation_failed':
      return isOutdated(error)
        ? 'Асуумж шинэчлэгдсэн байна. Хуудсаа шинэчлээд дахин эхэлнэ үү.'
        : 'Зарим хариулт дутуу эсвэл буруу байна. Асуултууд руу буцаж шалгана уу.'
    default:
      return error.status >= 500 ? 'Сервер түр ажиллахгүй байна. Дахин оролдоно уу.' : 'Алдаа гарлаа. Дахин оролдоно уу.'
  }
}

function isOutdated(error: ApiError) {
  const errors = error.body.errors as Record<string, string[]> | undefined
  return Boolean(errors?.questionnaire_version)
}
