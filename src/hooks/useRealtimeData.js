import { useState, useEffect, useRef } from "react";
import { subscribeToCollection } from "@/lib/firebase";

export const useRealtimeData = (
  initialData = [],
  collectionId,
  query = null
) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        // Unsubscribe from previous subscription if exists
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }

        // Subscribe to real-time updates
        const unsubscribe = await subscribeToCollection(
          collectionId,
          (payload) => {
            if (!isMounted) return;

            setData((currentData) => {
              switch (payload.event) {
                case "create":
                  return [payload.data, ...currentData];
                case "update":
                  return currentData.map((item) =>
                    item.$id === payload.data.$id ? payload.data : item
                  );
                case "delete":
                  return currentData.filter(
                    (item) => item.$id !== payload.data.$id
                  );
                default:
                  return currentData;
              }
            });
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [collectionId]);

  return { data, setData, isLoading, error };
};
