import { useState, useEffect } from 'react'
import { getCurrentUser, db, COLLECTIONS, query, collection, where, getDocs } from '@/lib/firebase'

export function useUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          // Fetch the user document from the database
          const q = query(
            collection(db, COLLECTIONS.USERS),
            where('accountId', '==', currentUser.uid)
          )
          const userSnapshot = await getDocs(q)

          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0].data()
            setUser({
              ...currentUser,
              ...userDoc // Merge the database user data with the account data
            })
          } else {
            setUser(currentUser)
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading }
}

