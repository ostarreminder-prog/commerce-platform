import { getTranslations } from "next-intl/server";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { sampleOrders } from "@repo/api-client";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Kbd } from "@repo/ui/components/kbd";
import { Progress } from "@repo/ui/components/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";

const SETUP_PROGRESS = 62;

export async function MiscDemo() {
  const t = await getTranslations("designSystem.misc");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
              <TabsTrigger value="activity">{t("activity")}</TabsTrigger>
              <TabsTrigger value="notes">{t("notes")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-muted-foreground text-sm">
              {t("overviewBody")}
            </TabsContent>
            <TabsContent value="activity" className="text-muted-foreground text-sm">
              {t("activityBody")}
            </TabsContent>
            <TabsContent value="notes" className="text-muted-foreground text-sm">
              {t("notesBody")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle id="setup-progress-label">{t("setupProgress")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <Progress value={SETUP_PROGRESS} aria-labelledby="setup-progress-label" />
            <span className="num text-sm font-medium">{SETUP_PROGRESS}%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{t("avatars")}</span>
            <div className="flex">
              {sampleOrders.slice(0, 4).map((order) => (
                <Avatar key={order.id} className="border-background -ms-2 border-2 first:ms-0">
                  <AvatarFallback>{order.customer.slice(0, 1)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            {t("shortcut")} <Kbd>Ctrl K</Kbd>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 lg:col-span-2 lg:grid-cols-2">
        <Alert variant="info">
          <Info aria-hidden />
          <div>
            <AlertTitle>{t("alertInfoTitle")}</AlertTitle>
            <AlertDescription>{t("alertInfo")}</AlertDescription>
          </div>
        </Alert>
        <Alert variant="success">
          <CheckCircle2 aria-hidden />
          <div>
            <AlertTitle>{t("alertSuccessTitle")}</AlertTitle>
            <AlertDescription>{t("alertSuccess")}</AlertDescription>
          </div>
        </Alert>
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <div>
            <AlertTitle>{t("alertWarningTitle")}</AlertTitle>
            <AlertDescription>{t("alertWarning")}</AlertDescription>
          </div>
        </Alert>
        <Alert variant="destructive">
          <XCircle aria-hidden />
          <div>
            <AlertTitle>{t("alertErrorTitle")}</AlertTitle>
            <AlertDescription>{t("alertError")}</AlertDescription>
          </div>
        </Alert>
      </div>
    </div>
  );
}
