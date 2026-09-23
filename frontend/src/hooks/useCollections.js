import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  addArticleToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeArticleFromCollection,
  updateCollection,
} from "../services/collections";

export const collectionsQueryKey = ["collections"];
export const collectionQueryKey = (collectionId) => [
  "collections",
  collectionId,
];

export const DEFAULT_COLLECTIONS_LIMIT = 20;

function useCollectionsQuery({ limit = DEFAULT_COLLECTIONS_LIMIT } = {}) {
  const { headers } = useAuth();

  return useInfiniteQuery({
    enabled: Boolean(headers),
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      listCollections({ cursor: pageParam, headers, limit }),
    queryKey: collectionsQueryKey,
  });
}

function useCollectionQuery({
  collectionId,
  limit = DEFAULT_COLLECTIONS_LIMIT,
} = {}) {
  const { headers } = useAuth();

  return useInfiniteQuery({
    enabled: Boolean(headers && collectionId),
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      getCollection({ collectionId, cursor: pageParam, headers, limit }),
    queryKey: collectionQueryKey(collectionId),
  });
}

function useCollectionMutations() {
  const { headers } = useAuth();
  const queryClient = useQueryClient();

  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: collectionsQueryKey });

  const create = useMutation({
    mutationFn: ({ name, description }) =>
      createCollection({ description, headers, name }),
    onSuccess: invalidateLists,
  });

  const update = useMutation({
    mutationFn: ({ collectionId, name, description }) =>
      updateCollection({ collectionId, description, headers, name }),
    onSuccess: (_collection, { collectionId }) => {
      invalidateLists();
      queryClient.invalidateQueries({
        queryKey: collectionQueryKey(collectionId),
      });
    },
  });

  const remove = useMutation({
    mutationFn: ({ collectionId }) =>
      deleteCollection({ collectionId, headers }),
    onSuccess: (_data, { collectionId }) => {
      invalidateLists();
      queryClient.removeQueries({
        queryKey: collectionQueryKey(collectionId),
      });
    },
  });

  const addArticle = useMutation({
    mutationFn: ({ collectionId, slug }) =>
      addArticleToCollection({ collectionId, headers, slug }),
    onSuccess: (_article, { collectionId }) => {
      invalidateLists();
      queryClient.invalidateQueries({
        queryKey: collectionQueryKey(collectionId),
      });
    },
  });

  const removeArticle = useMutation({
    mutationFn: ({ collectionId, slug }) =>
      removeArticleFromCollection({ collectionId, headers, slug }),
    onSuccess: (_data, { collectionId }) => {
      invalidateLists();
      queryClient.invalidateQueries({
        queryKey: collectionQueryKey(collectionId),
      });
    },
  });

  return { addArticle, create, remove, removeArticle, update };
}

export {
  useCollectionMutations,
  useCollectionQuery,
  useCollectionsQuery,
};
