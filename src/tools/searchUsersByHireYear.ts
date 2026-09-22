import axios from "axios";
import type { User } from "@microsoft/microsoft-graph-types";

type GraphUsersResponse = {
    value: User[];
};

export async function searchUsersByHireYear(
    graphAccessToken: string,
    hireYear: number,
): Promise<User[]> {
    const response = await axios.get<GraphUsersResponse>(
        "https://graph.microsoft.com/v1.0/users",
        {
            headers: {
                Authorization: `Bearer ${graphAccessToken}`,
            },
            params: {
                $select:
                    "id,displayName,mail,userPrincipalName,department,employeeHireDate",
            },
        },
    );

    return response.data.value.filter((user) => {
        if (!user.employeeHireDate) {
            return false;
        }

        return new Date(user.employeeHireDate).getUTCFullYear() === hireYear;
    });
}