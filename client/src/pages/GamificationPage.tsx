import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { gamificationApi } from "@/api/gamification";
import { departmentsApi } from "@/api/departments";
import { employeesApi } from "@/api/employees";
import { queryClient } from "@/lib/queryClient";
import {
  badgeFormSchema,
  challengeFormSchema,
  challengeParticipationFormSchema,
  rewardFormSchema,
  rewardRedemptionFormSchema,
  type BadgeFormInput,
  type ChallengeFormInput,
  type ChallengeParticipationFormInput,
  type RewardFormInput,
  type RewardRedemptionFormInput
} from "@shared/schemas";

const today = new Date().toISOString().slice(0, 10);

const challengeDefaults: ChallengeFormInput = {
  title: "",
  description: "",
  type: "INDIVIDUAL",
  status: "DRAFT",
  startDate: today,
  endDate: "",
  targetValue: 1,
  xpReward: 10,
  badgeId: "",
  isAutoBadge: true
};

const participationDefaults: ChallengeParticipationFormInput = {
  employeeId: "",
  status: "ENROLLED",
  progressValue: 0,
  completedAt: "",
  awardedXp: 0
};

const badgeDefaults: BadgeFormInput = {
  name: "",
  description: "",
  icon: "",
  xpThreshold: 0,
  isActive: true
};

const rewardDefaults: RewardFormInput = {
  name: "",
  description: "",
  xpCost: 25,
  isActive: true
};

const redemptionDefaults: RewardRedemptionFormInput = {
  employeeId: "",
  status: "REQUESTED",
  notes: ""
};

export function GamificationPage() {
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const dashboardQuery = useQuery({ queryKey: ["gamification", "dashboard"], queryFn: gamificationApi.dashboard });
  const challengesQuery = useQuery({ queryKey: ["gamification", "challenges"], queryFn: gamificationApi.challenges });
  const badgesQuery = useQuery({ queryKey: ["gamification", "badges"], queryFn: gamificationApi.badges });
  const rewardsQuery = useQuery({ queryKey: ["gamification", "rewards"], queryFn: gamificationApi.rewards });
  const employeesQuery = useQuery({ queryKey: ["employees", "gamification"], queryFn: () => employeesApi.list("?page=1&pageSize=100") });
  const departmentsQuery = useQuery({ queryKey: ["departments", "gamification"], queryFn: () => departmentsApi.list("?page=1&pageSize=100") });

  const dashboard = dashboardQuery.data?.data;
  const challenges = challengesQuery.data?.data ?? [];
  const badges = badgesQuery.data?.data ?? [];
  const rewards = rewardsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data ?? [];

  const challengeForm = useForm<ChallengeFormInput>({ resolver: zodResolver(challengeFormSchema), defaultValues: challengeDefaults });
  const participationForm = useForm<ChallengeParticipationFormInput>({ resolver: zodResolver(challengeParticipationFormSchema), defaultValues: participationDefaults });
  const badgeForm = useForm<BadgeFormInput>({ resolver: zodResolver(badgeFormSchema), defaultValues: badgeDefaults });
  const rewardForm = useForm<RewardFormInput>({ resolver: zodResolver(rewardFormSchema), defaultValues: rewardDefaults });
  const redemptionForm = useForm<RewardRedemptionFormInput>({ resolver: zodResolver(rewardRedemptionFormSchema), defaultValues: redemptionDefaults });

  useEffect(() => {
    const selected = challenges.find((challenge) => challenge.id === editingChallengeId);
    if (selected) {
      challengeForm.reset({
        title: selected.title,
        description: selected.description ?? "",
        type: selected.type as ChallengeFormInput["type"],
        status: selected.status as ChallengeFormInput["status"],
        startDate: new Date(selected.startDate).toISOString().slice(0, 10),
        endDate: selected.endDate ? new Date(selected.endDate).toISOString().slice(0, 10) : "",
        targetValue: selected.targetValue,
        xpReward: selected.xpReward,
        badgeId: selected.badge?.id ?? "",
        isAutoBadge: selected.isAutoBadge
      });
    }
  }, [challengeForm, challenges, editingChallengeId]);

  useEffect(() => {
    const selected = badges.find((badge) => badge.id === editingBadgeId);
    if (selected) {
      badgeForm.reset({
        name: selected.name,
        description: selected.description ?? "",
        icon: selected.icon ?? "",
        xpThreshold: selected.xpThreshold,
        isActive: selected.isActive
      });
    }
  }, [badgeForm, badges, editingBadgeId]);

  useEffect(() => {
    const selected = rewards.find((reward) => reward.id === editingRewardId);
    if (selected) {
      rewardForm.reset({
        name: selected.name,
        description: selected.description ?? "",
        xpCost: selected.xpCost,
        isActive: selected.isActive
      });
    }
  }, [editingRewardId, rewardForm, rewards]);

  const challengeMutation = useMutation({
    mutationFn: async (values: ChallengeFormInput) => (editingChallengeId ? gamificationApi.updateChallenge(editingChallengeId, values) : gamificationApi.createChallenge(values)),
    onSuccess: async () => {
      setEditingChallengeId(null);
      challengeForm.reset(challengeDefaults);
      await queryClient.invalidateQueries({ queryKey: ["gamification", "challenges"] });
      await queryClient.invalidateQueries({ queryKey: ["gamification", "dashboard"] });
    }
  });

  const participationMutation = useMutation({
    mutationFn: async (values: ChallengeParticipationFormInput) => {
      if (!selectedChallengeId) throw new Error("Select a challenge first");
      return gamificationApi.addParticipation(selectedChallengeId, values);
    },
    onSuccess: async () => {
      participationForm.reset(participationDefaults);
      await queryClient.invalidateQueries({ queryKey: ["gamification", "challenges"] });
      await queryClient.invalidateQueries({ queryKey: ["gamification", "dashboard"] });
    }
  });

  const badgeMutation = useMutation({
    mutationFn: async (values: BadgeFormInput) => (editingBadgeId ? gamificationApi.updateBadge(editingBadgeId, values) : gamificationApi.createBadge(values)),
    onSuccess: async () => {
      setEditingBadgeId(null);
      badgeForm.reset(badgeDefaults);
      await queryClient.invalidateQueries({ queryKey: ["gamification", "badges"] });
      await queryClient.invalidateQueries({ queryKey: ["gamification", "dashboard"] });
    }
  });

  const rewardMutation = useMutation({
    mutationFn: async (values: RewardFormInput) => (editingRewardId ? gamificationApi.updateReward(editingRewardId, values) : gamificationApi.createReward(values)),
    onSuccess: async () => {
      setEditingRewardId(null);
      rewardForm.reset(rewardDefaults);
      await queryClient.invalidateQueries({ queryKey: ["gamification", "rewards"] });
      await queryClient.invalidateQueries({ queryKey: ["gamification", "dashboard"] });
    }
  });

  const redemptionMutation = useMutation({
    mutationFn: async (values: RewardRedemptionFormInput) => {
      if (!selectedRewardId) throw new Error("Select a reward first");
      return gamificationApi.redeemReward(selectedRewardId, values);
    },
    onSuccess: async () => {
      redemptionForm.reset(redemptionDefaults);
      await queryClient.invalidateQueries({ queryKey: ["gamification", "rewards"] });
      await queryClient.invalidateQueries({ queryKey: ["gamification", "dashboard"] });
    }
  });

  const topCards = useMemo(
    () => [
      { label: "Challenges", value: dashboard?.challengeCount ?? 0 },
      { label: "Badges", value: dashboard?.badgeCount ?? 0 },
      { label: "Rewards", value: dashboard?.rewardCount ?? 0 },
      { label: "Completion rate", value: `${dashboard?.completionRate ?? 0}%` }
    ],
    [dashboard]
  );

  return (
    <Page title="Gamification" description="Track XP, challenges, badges, and reward redemptions.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <Card key={card.label}>
            <CardContent>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Employee</th>
                <th className="py-3 pr-4">Department</th>
                <th className="py-3 pr-4">XP</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.leaderboard?.map((employee: any) => (
                <tr key={employee.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{employee.department?.name ?? "-"}</td>
                  <td className="py-3 pr-4">{employee.xpPoints}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Challenges</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingChallengeId(null); challengeForm.reset(challengeDefaults); }}>
              New challenge
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Challenge</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">XP</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((challenge) => (
                  <tr key={challenge.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{challenge.title}</div>
                      <div className="text-xs text-slate-500">{challenge._count.participations} participations</div>
                    </td>
                    <td className="py-3 pr-4">{challenge.type}</td>
                    <td className="py-3 pr-4">{challenge.xpReward}</td>
                    <td className="py-3 pr-4">
                      <UiBadge className={challenge.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                        {challenge.status}
                      </UiBadge>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedChallengeId(challenge.id)}>Select</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingChallengeId(challenge.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => gamificationApi.deleteChallenge(challenge.id).then(async () => {
                          await queryClient.invalidateQueries({ queryKey: ["gamification", "challenges"] });
                          await queryClient.invalidateQueries({ queryKey: ["gamification", "dashboard"] });
                        })}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingChallengeId ? "Edit challenge" : "Create challenge"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={challengeForm.handleSubmit((values) => challengeMutation.mutate(values))}>
              <Field label="Title">
                <Input {...challengeForm.register("title")} />
              </Field>
              <Field label="Description">
                <Textarea {...challengeForm.register("description")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type">
                  <Select {...challengeForm.register("type")}>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="TEAM">Team</option>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select {...challengeForm.register("status")}>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date">
                  <Input type="date" {...challengeForm.register("startDate")} />
                </Field>
                <Field label="End date">
                  <Input type="date" {...challengeForm.register("endDate")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Target value">
                  <Input type="number" {...challengeForm.register("targetValue", { valueAsNumber: true })} />
                </Field>
                <Field label="XP reward">
                  <Input type="number" {...challengeForm.register("xpReward", { valueAsNumber: true })} />
                </Field>
              </div>
              <Field label="Badge">
                <Select {...challengeForm.register("badgeId")}>
                  <option value="">No badge</option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.id}>{badge.name}</option>
                  ))}
                </Select>
              </Field>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4" {...challengeForm.register("isAutoBadge")} />
                Auto award badge
              </label>
              <div className="flex gap-2">
                <Button type="submit" disabled={challengeMutation.isPending}>{editingChallengeId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingChallengeId(null); challengeForm.reset(challengeDefaults); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Challenge participation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Selected challenge: {selectedChallengeId ? challenges.find((challenge) => challenge.id === selectedChallengeId)?.title ?? "Unknown" : "Choose a challenge above"}
          </div>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={participationForm.handleSubmit((values) => participationMutation.mutate(values))}>
            <Field label="Employee">
              <Select {...participationForm.register("employeeId")}>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.firstName} {employee.lastName}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select {...participationForm.register("status")}>
                <option value="ENROLLED">Enrolled</option>
                <option value="ATTENDED">Attended</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </Field>
            <Field label="Progress">
              <Input type="number" {...participationForm.register("progressValue", { valueAsNumber: true })} />
            </Field>
            <Field label="Awarded XP">
              <Input type="number" {...participationForm.register("awardedXp", { valueAsNumber: true })} />
            </Field>
            <Field label="Completed at">
              <Input type="date" {...participationForm.register("completedAt")} />
            </Field>
            <div className="md:col-span-2 xl:col-span-4">
              <Button type="submit" disabled={participationMutation.isPending}>Record participation</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Badges</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingBadgeId(null); badgeForm.reset(badgeDefaults); }}>
              New badge
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Badge</th>
                  <th className="py-3 pr-4">XP threshold</th>
                  <th className="py-3 pr-4">Awards</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {badges.map((badge) => (
                  <tr key={badge.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{badge.name}</td>
                    <td className="py-3 pr-4">{badge.xpThreshold}</td>
                    <td className="py-3 pr-4">{badge._count.awards}</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedBadgeId(badge.id)}>Select</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingBadgeId(badge.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => gamificationApi.deleteBadge(badge.id).then(async () => {
                          await queryClient.invalidateQueries({ queryKey: ["gamification", "badges"] });
                        })}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingBadgeId ? "Edit badge" : "Create badge"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={badgeForm.handleSubmit((values) => badgeMutation.mutate(values))}>
              <Field label="Name">
                <Input {...badgeForm.register("name")} />
              </Field>
              <Field label="Description">
                <Textarea {...badgeForm.register("description")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Icon">
                  <Input {...badgeForm.register("icon")} />
                </Field>
                <Field label="XP threshold">
                  <Input type="number" {...badgeForm.register("xpThreshold", { valueAsNumber: true })} />
                </Field>
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4" {...badgeForm.register("isActive")} />
                Active badge
              </label>
              <div className="flex gap-2">
                <Button type="submit" disabled={badgeMutation.isPending}>{editingBadgeId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingBadgeId(null); badgeForm.reset(badgeDefaults); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual badge award</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Selected badge: {selectedBadgeId ? badges.find((badge) => badge.id === selectedBadgeId)?.name ?? "Unknown" : "Choose a badge above"}
          </div>
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={(event) => {
            event.preventDefault();
            const employeeId = (event.currentTarget.elements.namedItem("employeeId") as HTMLSelectElement | null)?.value ?? "";
            if (selectedBadgeId && employeeId) {
              gamificationApi.awardBadge(selectedBadgeId, employeeId).then(async () => {
                await queryClient.invalidateQueries({ queryKey: ["gamification", "badges"] });
                await queryClient.invalidateQueries({ queryKey: ["gamification", "dashboard"] });
              });
            }
          }}>
            <div className="flex-1">
              <Field label="Employee">
                <Select name="employeeId" defaultValue="">
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.firstName} {employee.lastName}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button type="submit">Award badge</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rewards</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingRewardId(null); rewardForm.reset(rewardDefaults); }}>
              New reward
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Reward</th>
                  <th className="py-3 pr-4">XP cost</th>
                  <th className="py-3 pr-4">Redemptions</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => (
                  <tr key={reward.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{reward.name}</td>
                    <td className="py-3 pr-4">{reward.xpCost}</td>
                    <td className="py-3 pr-4">{reward._count.redemptions}</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedRewardId(reward.id)}>Select</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingRewardId(reward.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => gamificationApi.deleteReward(reward.id).then(async () => {
                          await queryClient.invalidateQueries({ queryKey: ["gamification", "rewards"] });
                        })}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingRewardId ? "Edit reward" : "Create reward"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={rewardForm.handleSubmit((values) => rewardMutation.mutate(values))}>
              <Field label="Name">
                <Input {...rewardForm.register("name")} />
              </Field>
              <Field label="Description">
                <Textarea {...rewardForm.register("description")} />
              </Field>
              <Field label="XP cost">
                <Input type="number" {...rewardForm.register("xpCost", { valueAsNumber: true })} />
              </Field>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4" {...rewardForm.register("isActive")} />
                Active reward
              </label>
              <div className="flex gap-2">
                <Button type="submit" disabled={rewardMutation.isPending}>{editingRewardId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingRewardId(null); rewardForm.reset(rewardDefaults); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reward redemption</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Selected reward: {selectedRewardId ? rewards.find((reward) => reward.id === selectedRewardId)?.name ?? "Unknown" : "Choose a reward above"}
          </div>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={redemptionForm.handleSubmit((values) => redemptionMutation.mutate(values))}>
            <Field label="Employee">
              <Select {...redemptionForm.register("employeeId")}>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.firstName} {employee.lastName}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select {...redemptionForm.register("status")}>
                <option value="REQUESTED">Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </Field>
            <div className="md:col-span-2 xl:col-span-4">
              <Field label="Notes">
                <Textarea {...redemptionForm.register("notes")} />
              </Field>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <Button type="submit" disabled={redemptionMutation.isPending}>Create redemption</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Page>
  );
}
