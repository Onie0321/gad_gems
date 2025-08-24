import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  deleteDoc,
  COLLECTIONS 
} from "@/lib/firebase";

export function useFirebase() {
  const validateResetToken = async (userId, token) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.RESET_TOKENS),
        where('userId', '==', userId),
        where('token', '==', token),
        where('expiresAt', '>', new Date())
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error validating reset token:', error);
      return false;
    }
  };

  const resetPassword = async (userId, token, newPassword) => {
    try {
      // First, validate the token again
      const isValid = await validateResetToken(userId, token);
      if (!isValid) {
        throw new Error('Invalid or expired token');
      }

      // Note: Firebase handles password reset differently
      // This would typically be handled through Firebase Auth's built-in reset flow
      // For now, we'll just invalidate the token
      const q = query(
        collection(db, COLLECTIONS.RESET_TOKENS),
        where('token', '==', token)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await deleteDoc(doc(db, COLLECTIONS.RESET_TOKENS, querySnapshot.docs[0].id));
      }

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  return {
    validateResetToken,
    resetPassword,
  };
}
  
  