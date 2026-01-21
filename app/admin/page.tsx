/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getAttendanceData,
  getUserHistory,
  logoutAdmin,
} from "./hooks/action";
import {
  archiveMonthlyData,
  getArchivesList,
  deleteArchive,
} from "./hooks/archive";
import { USER_DATABASE, UserData } from "./../constant/data";
import { Toaster, toast } from "sonner";

type Attendance = {
  id: string;
  name: string;
  position: string;
  date: number;
  month: string;
  photo: string | null;
  createdAt: Date;
  week: number;
};

type ArchiveData = {
  id: string;
  month: string;
  year: number;
  fileUrl: string;
  totalRecords: number;
  createdAt: Date;
};

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "today" | "history" | "members" | "user" | "settings"
  >("today");

  const [stats, setStats] = useState({ today: 0, totalAnggota: 0 });
  const [dataList, setDataList] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<Attendance[]>([]);

  const [archives, setArchives] = useState<ArchiveData[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);

  const [targetMonth, setTargetMonth] = useState<string>(
    MONTH_NAMES[new Date().getMonth()],
  ); // Default bulan ini
  const [targetYear, setTargetYear] = useState<number>(
    new Date().getFullYear(),
  );

  useEffect(() => {
    loadStats();

    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setTargetMonth(MONTH_NAMES[d.getMonth()]);
    setTargetYear(d.getFullYear());
  }, []);

  useEffect(() => {
    if (activeTab === "today") loadToday();
    if (activeTab === "history") loadHistory();
    if (activeTab === "settings") loadArchives();
  }, [activeTab]);

  const loadStats = async () => {
    const res = await getDashboardStats();
    setStats(res);
  };

  const loadToday = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const res = await getAttendanceData(today, today);
    setDataList(res);
    setLoading(false);
  };

  const loadHistory = async () => {
    setLoading(true);
    const res = await getAttendanceData(startDate, endDate, searchName);
    setDataList(res);
    setLoading(false);
  };

  const loadArchives = async () => {
    setLoading(true);
    const res = await getArchivesList();
    setArchives(res);
    setLoading(false);
  };

  const handleSearchHistory = (e: React.FormEvent) => {
    e.preventDefault();
    loadHistory();
  };

  const handleUserClick = async (name: string) => {
    setSelectedUser(name);
    setActiveTab("user");
    setLoading(true);
    const history = await getUserHistory(name);
    setUserHistory(history);
    setLoading(false);
  };

  const handleArchive = async () => {
    if (
      !confirm(
        `Anda akan mengarsipkan data presensi periode: \n${targetMonth} ${targetYear}\n\nPERINGATAN: Foto pada periode ini akan DIHAPUS. Lanjutkan?`,
      )
    )
      return;

    setIsArchiving(true);
    const res = await archiveMonthlyData(targetMonth, targetYear);
    setIsArchiving(false);

    if (res.success) {
      toast.success(res.message);
      loadArchives();
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteArchive = async (id: string, url: string) => {
    if (!confirm("Hapus file arsip ini? Data tidak bisa dikembalikan.")) return;

    const res = await deleteArchive(id, url);
    if (res.success) {
      toast.success(res.message);
      loadArchives();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 font-sans">
      <Toaster position="top-right" />

      <header className="bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 sticky top-0 z-30 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/20">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500">Monitoring Presensi</p>
            </div>
          </div>
          <button
            onClick={() => logoutAdmin()}
            className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors border border-red-200 dark:border-red-900/30"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-800 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider relative z-10">
              Hadir Hari Ini
            </p>
            <div className="flex items-end gap-2 mt-2 relative z-10">
              <p className="text-4xl font-black text-orange-600 leading-none">
                {stats.today}
              </p>
              <p className="text-sm font-bold text-gray-400 mb-1">Orang</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-800 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider relative z-10">
              Total Karyawan
            </p>
            <div className="flex items-end gap-2 mt-2 relative z-10">
              <p className="text-4xl font-black text-gray-900 dark:text-white leading-none">
                {stats.totalAnggota}
              </p>
              <p className="text-sm font-bold text-gray-400 mb-1">Terdaftar</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 border-b dark:border-zinc-800 scrollbar-hide">
          {[
            { id: "today", label: "Presensi Hari Ini" },
            { id: "history", label: "Riwayat & Laporan" },
            { id: "members", label: "Daftar Anggota" },
            { id: "settings", label: "⚙️ Manajemen Data" },
            ...(selectedUser
              ? [{ id: "user", label: `Detail: ${selectedUser}` }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-gray-900 text-white dark:bg-white dark:text-black shadow-lg" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-100">
          {(activeTab === "today" || activeTab === "history") && (
            <div className="space-y-6">
              {activeTab === "history" && (
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border dark:border-zinc-800 shadow-sm">
                  <form
                    onSubmit={handleSearchHistory}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 pl-1">
                            Dari Tanggal
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-zinc-950 dark:border-zinc-700 font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 pl-1">
                            Sampai Tanggal
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-zinc-950 dark:border-zinc-700 font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 md:w-1/3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 pl-1">
                          Cari Nama
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nama Karyawan..."
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-zinc-950 dark:border-zinc-700 text-sm"
                          />
                          <button
                            type="submit"
                            className="bg-orange-600 text-white px-4 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-500/20"
                          >
                            🔍
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-zinc-950 border-b dark:border-zinc-800">
                      <tr>
                        <th className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
                          Waktu
                        </th>
                        <th className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
                          Personil
                        </th>
                        <th className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
                          Foto
                        </th>
                        <th className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-zinc-800">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-12 text-center text-gray-400 animate-pulse"
                          >
                            Memuat data...
                          </td>
                        </tr>
                      ) : dataList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-12 text-center text-gray-400"
                          >
                            {activeTab === "today"
                              ? "Belum ada yang presensi hari ini."
                              : "Tidak ada data pada rentang tanggal ini."}
                          </td>
                        </tr>
                      ) : (
                        dataList.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group"
                          >
                            <td className="p-4">
                              <div className="font-bold text-gray-900 dark:text-white">
                                {new Date(item.createdAt).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-gray-900 dark:text-white">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.position}
                              </div>
                            </td>
                            <td className="p-4">
                              {item.photo?.includes("ARCHIVED") ? (
                                <span className="text-xs text-gray-400">ARCHIVED</span>
                              ) : (
                                <a
                                  href={item.photo!}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                                >
                                  📸 Lihat
                                </a>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleUserClick(item.name)}
                                className="text-gray-400 hover:text-orange-600 font-bold text-xs px-3 py-1 rounded-full hover:bg-orange-50 transition-all opacity-0 group-hover:opacity-100"
                              >
                                Lihat Detail →
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(USER_DATABASE).map((item: any, idx: number) => {
                const user = item as UserData;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group"
                  >
                    <div className="w-14 h-14 bg-linear-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 rounded-full flex items-center justify-center text-xl font-black text-gray-400 group-hover:text-orange-500 group-hover:from-orange-100 group-hover:to-orange-50 transition-colors">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2 truncate">
                        {user.position} • {user.id}
                      </p>
                      <button
                        onClick={() => handleUserClick(user.name)}
                        className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        Lihat Riwayat Absen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border dark:border-zinc-800 shadow-sm">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                  📦 Pengarsipan & Pembersihan (Manual)
                </h2>
                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/20 mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Note:</strong> Data pada periode yang dipilih akan
                    dijadikan .xlsx dan data pada periode tersebut dihapus.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-4 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <div className="flex-1 w-full grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">
                        Pilih Bulan
                      </label>
                      <select
                        value={targetMonth}
                        onChange={(e) => setTargetMonth(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-zinc-950 dark:border-zinc-700 text-sm font-bold"
                      >
                        {MONTH_NAMES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">
                        Tahun
                      </label>
                      <input
                        type="number"
                        value={targetYear}
                        onChange={(e) =>
                          setTargetYear(parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-zinc-950 dark:border-zinc-700 text-sm font-bold"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleArchive}
                    disabled={isArchiving}
                    className="w-full md:w-auto bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-xl font-bold hover:opacity-80 disabled:opacity-50 transition-all flex items-center justify-center gap-2 h-10.5"
                  >
                    {isArchiving ? "Memproses..." : "📂 Ekspor & Bersihkan"}
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b dark:border-zinc-800">
                  <h2 className="text-lg font-black">Riwayat Arsip (CSV)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-zinc-950 border-b dark:border-zinc-800">
                      <tr>
                        <th className="p-4 font-bold text-gray-500">Periode</th>
                        <th className="p-4 font-bold text-gray-500">
                          Total Data
                        </th>
                        <th className="p-4 font-bold text-gray-500">
                          Tanggal Arsip
                        </th>
                        <th className="p-4 font-bold text-gray-500 text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-zinc-800">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-gray-500"
                          >
                            Memuat arsip...
                          </td>
                        </tr>
                      ) : archives.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-gray-500"
                          >
                            Belum ada data yang diarsipkan.
                          </td>
                        </tr>
                      ) : (
                        archives.map((arch) => (
                          <tr
                            key={arch.id}
                            className="hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                          >
                            <td className="p-4 font-bold text-gray-900 dark:text-white">
                              {arch.month} {arch.year}
                            </td>
                            <td className="p-4 text-gray-600 dark:text-gray-400">
                              {arch.totalRecords} Baris
                            </td>
                            <td className="p-4 text-xs text-gray-500">
                              {new Date(arch.createdAt).toLocaleDateString(
                                "id-ID",
                              )}
                            </td>
                            <td className="p-4 flex justify-end gap-2">
                              <a
                                href={arch.fileUrl}
                                download={`Presensi-${arch.month}-${arch.year}.csv`}
                                className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 font-bold text-xs border border-green-200 hover:bg-green-100 transition-colors"
                              >
                                ⬇ Download
                              </a>
                              <button
                                onClick={() =>
                                  handleDeleteArchive(arch.id, arch.fileUrl)
                                }
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold text-xs border border-red-200 hover:bg-red-100 transition-colors"
                              >
                                🗑 Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "user" && selectedUser && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border dark:border-zinc-800 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-b from-orange-500/5 to-transparent pointer-events-none"></div>
                  <div className="w-24 h-24 bg-linear-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-4xl font-black mb-4 mx-auto shadow-xl shadow-orange-500/30">
                    {selectedUser.charAt(0)}
                  </div>
                  <h2 className="text-2xl font-black mb-1">{selectedUser}</h2>
                  <p className="text-gray-500 font-medium text-sm mb-6">
                    {(USER_DATABASE as any)[selectedUser]?.position ||
                      userHistory[0]?.position ||
                      "Karyawan"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-left bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl border dark:border-zinc-800">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">
                        Total Hadir
                      </p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">
                        {userHistory.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">
                        Terakhir
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {userHistory[0]
                          ? new Date(
                              userHistory[0].createdAt,
                            ).toLocaleDateString("id-ID")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border dark:border-zinc-800 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      📅
                    </div>
                    <h3 className="font-bold text-lg">Kalender Kehadiran</h3>
                  </div>
                  <CalendarView attendanceData={userHistory} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CalendarView({ attendanceData }: { attendanceData: Attendance[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(today);

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const attendedDates = attendanceData
    .filter((d) => {
      const date = new Date(d.createdAt);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    })
    .map((d) => new Date(d.createdAt).getDate());

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl border dark:border-zinc-800">
        <button
          onClick={() => changeMonth(-1)}
          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
        >
          ←
        </button>
        <span className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-sm">
          {viewDate.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}

        {daysArray.map((day) => {
          const isAttended = attendedDates.includes(day);
          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          return (
            <div
              key={day}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold border transition-all relative ${
                isAttended
                  ? "bg-linear-to-br from-orange-500 to-amber-500 text-white border-transparent shadow-lg shadow-orange-500/20 scale-105 z-10"
                  : "bg-white dark:bg-zinc-900 text-gray-400 border-gray-100 dark:border-zinc-800"
              } ${isToday && !isAttended ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
            >
              {day}
              {isAttended && (
                <div className="w-1 h-1 bg-white/50 rounded-full mt-1"></div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4 text-xs justify-center border-t dark:border-zinc-800 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-linear-to-br from-orange-500 to-amber-500 rounded-full"></div>{" "}
          Hadir
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white border border-gray-200 rounded-full"></div>{" "}
          Tidak Hadir
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-500 rounded-full"></div>{" "}
          Hari Ini
        </div>
      </div>
    </div>
  );
}
