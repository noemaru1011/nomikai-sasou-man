import axios from "axios";
import type { User } from "@microsoft/microsoft-graph-types";

type GraphUsersResponse = {
    value: User[];
};

export async function searchUsersByDepartment(
    graphAccessToken: string,
    department: string,
): Promise<User[]> {
    const response = await axios.get<GraphUsersResponse>(
        "https://graph.microsoft.com/v1.0/users",
        {
            headers: {
                Authorization: `Bearer ${graphAccessToken}`,
            },
            params: {
                $filter: `department eq '${department.replaceAll("'", "''")}'`,
                $select: "id,displayName,mail,userPrincipalName,department",
            },
        },
    );

    return response.data.value;
}