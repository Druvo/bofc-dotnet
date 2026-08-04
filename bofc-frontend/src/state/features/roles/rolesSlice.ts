import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["roles"],
});

export interface Role {
    id: number;
    name: string;
}

export interface RolesListResType extends BasicResType {
    content: Role[];
}

export interface AssignRolesPayload {
    playerRoleMappings: {
        [playerId: string]: number[];
    };
}

export const rolesApi = apiWithTags.injectEndpoints({
    endpoints: (build) => ({
        getRoles: build.query<RolesListResType, void>({
            query: () => "/roles",
            providesTags: ["roles"],
        }),
        assignRoles: build.mutation<BasicResType, AssignRolesPayload>({
            query: (data) => ({
                url: "roles/assign",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["roles"],
        }),
        getPlayerRoles: build.query<RolesListResType, { playerId: number }>({
            query: ({ playerId }) => `/players/${playerId}/roles`,
            providesTags: ["roles"],
        }),
    }),
});

export const {
    useGetRolesQuery,
    useAssignRolesMutation,
    useGetPlayerRolesQuery,
} = rolesApi;
