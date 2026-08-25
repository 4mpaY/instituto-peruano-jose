export const getBaseURL = () => {
  if (typeof window === 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      return `http://localhost:${process.env.PORT || 3000}`
    }

    
return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  return ''
}
