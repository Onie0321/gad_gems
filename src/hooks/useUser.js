import { useState, useEffect } from 'react'
import { Account, Client, Query } from 'appwrite'
import { databases, databaseId, userCollectionId, account, client } from '@/lib/appwrite'

export function useUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentAccount = await account.get()
        if (currentAccount) {
          // Fetch the user document from the database
          const userDoc = await databases.listDocuments(
            databaseId,
            userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
          )

          if (userDoc.documents.length > 0) {
            setUser({
              ...currentAccount,
              ...userDoc.documents[0] // Merge the database user data with the account data
            })
          } else {
            setUser(currentAccount)
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

