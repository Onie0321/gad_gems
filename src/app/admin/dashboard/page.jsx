const fetchAllData = async () => {
  try {
    setLoading(true);

    // Fetch current academic period
    const currentPeriodResult = await getCurrentAcademicPeriod();

    if (!currentPeriodResult) {
      setError("No active academic period found");
      setLoading(false);
      return;
    }

    // Fetch users
    const usersResult = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.limit(100)]
    );
    const fetchedUsers = usersResult.documents;
    setUsers(fetchedUsers);

    // Fetch events
    const eventsResult = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [Query.limit(100)]
    );
    const fetchedEvents = eventsResult.documents;
    setEvents(fetchedEvents);

    // Fetch participants
    const [studentsResult, staffFacultyResult, communityResult] =
      await Promise.all([
        databases.listDocuments(databaseId, studentCollectionId, [
          Query.limit(100),
        ]),
        databases.listDocuments(databaseId, staffFacultyCollectionId, [
          Query.limit(100),
        ]),
        databases.listDocuments(databaseId, communityCollectionId, [
          Query.limit(100),
        ]),
      ]);

    const fetchedParticipants = {
      students: studentsResult.documents,
      staffFaculty: staffFacultyResult.documents,
      community: communityResult.documents,
    };

    setParticipants(fetchedParticipants);

    // Calculate participant totals
    const totals = {
      students: fetchedParticipants.students.length,
      staffFaculty: fetchedParticipants.staffFaculty.length,
      community: fetchedParticipants.community.length,
    };
    setParticipantTotals(totals);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
