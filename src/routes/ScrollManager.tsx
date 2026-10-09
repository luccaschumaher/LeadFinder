import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Rola até a âncora (#secao) ao navegar entre rotas, ou volta ao topo. */
export function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
