import { databaseId, databases } from "@/lib/appwrite"

export function useAppwrite() {
    const validateResetToken = async (userId, token) => {
      try {
        // Assuming you have a 'reset_tokens' collection in your database
        const response = await databases.listDocuments(
            databaseId,
          'reset_tokens',
          [
            Query.equal('userId', userId),
            Query.equal('token', token),
            Query.greaterThan('expiresAt', new Date().toI())
          ]
        )
  
        return response.total > 0
      } catch (error) {
        console.error('Error validating reset token:', error)
        return false
      }
    }
  
    const resetPassword = async (userId, token, newPassword) => {
      try {
        // First, validate the token again
        const isValid = await validateResetToken(userId, token)
        if (!isValid) {
          throw new Error('Invalid or expired token')
        }
  
        // Update the password
        await account.updateRecovery(userId, token, newPassword, newPassword)
  
        // Invalidate the token
        await databases.deleteDocument(
            databaseId,
          'reset_tokens',
          token
        )
  
        return true
      } catch (error) {
        console.error('Error resetting password:', error)
        throw error
      }
    }
  
    return {
      validateResetToken,
      resetPassword,
    }
  }
  
  