import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import { Search, Star, MapPin, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getInitials } from "../lib/utils";
import { UserManagement } from "../../../declarations/UserManagement";
import type { LawyerProfile } from "../../../declarations/UserManagement/UserManagement.did";

export default function FindLawyer() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: lawyers = [], isLoading } = useQuery<LawyerProfile[]>({
    queryKey: ["lawyers"],
    queryFn: async () => {
      const result = await UserManagement.getAllLawyers();
      return result;
    },
  });

  const filteredLawyers = lawyers.filter(
    (lawyer) =>
      lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.specializations.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lawyer.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: [] | [bigint]) => {
    if (amount.length === 0) return "N/A";
    return `$${Number(amount[0])}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Find a Lawyer</h1>
        <p className="text-muted-foreground">
          Search for qualified lawyers based on specialization, location, and hourly rate.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, specialization, or jurisdiction..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-lawyers"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredLawyers.map((lawyer) => (
            <Card
              key={lawyer.principal.toString()}
              className="hover-elevate transition-all"
              data-testid={`lawyer-card-${lawyer.principal.toString()}`}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">{getInitials(lawyer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="mb-2">{lawyer.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{lawyer.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({Number(lawyer.reviewCount)} reviews)</span>
                      </div>
                      {lawyer.verified && (
                        <Badge variant="default" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{lawyer.jurisdiction}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {lawyer.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{lawyer.bio}</p>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-semibold">{formatCurrency(lawyer.hourlyRate)}/hr</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Number(lawyer.completedEngagements)} completed cases
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setLocation(`/engagement/create?lawyer=${lawyer.principal.toString()}`)}
                  data-testid={`button-request-engagement-${lawyer.principal.toString()}`}
                >
                  Request Engagement
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredLawyers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No lawyers found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}