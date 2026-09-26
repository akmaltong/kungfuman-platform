import Link from "next/link";

export const metadata = {
  title: "Ассоциация традиционных и внутренних искусств · АТВИ",
  description:
    "Институциональный уровень: светская некоммерческая инициатива по сохранению и передаче традиционных и внутренних искусств. Проект в стадии подготовки, не спортивная федерация.",
};

// Институциональный слой бренда — АТВИ. Строже и спокойнее школьных страниц:
// тонкие золотые линии, малые прописные надписи, воздух. Единый шрифт сайта.
function Rule() {
  return <div className="mx-auto my-14 h-px w-full max-w-[220px] bg-gold-dim" />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[12px] uppercase tracking-[0.32em] text-gold-dim">
      {children}
    </p>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[27px] font-bold leading-tight text-paper">
      {children}
    </h2>
  );
}

export default function AssociationPage() {
  return (
    <main className="mx-auto max-w-[760px] px-6 pb-24">
      {/* Hero */}
      <header className="pt-16 text-center">
        <div
          aria-hidden
          className="mx-auto mb-8 grid h-[92px] w-[92px] place-items-center rounded-full border border-gold-dim font-serif text-[42px] leading-none text-gold"
        >
          會
        </div>
        <p className="mb-4 text-[12px] uppercase tracking-[0.32em] text-gold-dim">
          Институциональный уровень
        </p>
        <h1 className="mx-auto max-w-[16em] font-serif text-[34px] font-bold leading-[1.12] text-paper sm:text-[42px]">
          Ассоциация традиционных и внутренних искусств
        </h1>
        <p className="mx-auto mt-5 max-w-[34em] text-[16px] leading-[1.6] text-paper-muted">
          Светская некоммерческая инициатива по сохранению, систематизации и
          передаче традиционных и внутренних искусств, культуры движения,
          дыхания и телесной структуры в Республике Таджикистан.
        </p>
        <p className="mx-auto mt-4 max-w-[30em] text-[13px] tracking-wide text-gold-dim">
          Рабочее сокращение — АТВИ · Association of Traditional &amp; Internal
          Arts (ATIA)
        </p>
      </header>

      {/* Статус проекта — честная оговорка */}
      <div className="mx-auto mt-12 max-w-[36em] border-l-[3px] border-gold-dim bg-ink-lacquer px-5 py-4 text-[14px] leading-[1.6] text-paper-muted">
        Это проект и концепция в стадии подготовки. На данном этапе Ассоциация
        не является зарегистрированной организацией, а документ — уставом.
        Окончательная правовая форма, наименование и виды деятельности
        проходят юридическую проверку до государственной регистрации.
      </div>

      <Rule />

      {/* Миссия */}
      <section className="text-center">
        <Label>Миссия</Label>
        <p className="mx-auto max-w-[30em] font-serif text-[22px] leading-[1.5] text-paper">
          Развивать традиционные искусства вне соревновательной модели спорта —
          с уважением к происхождению школ, преемственности передачи и
          безопасности практики.
        </p>
      </section>

      <Rule />

      {/* Что это и чем не является */}
      <section>
        <Label>Правовая рамка</Label>
        <H2>Что это — и чем это не является</H2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="border border-gold-dim bg-ink p-5">
            <h3 className="font-serif text-[18px] font-bold text-gold">
              Это
            </h3>
            <ul className="mt-3 space-y-2 text-[15px] leading-[1.55] text-paper-muted">
              <li>· самостоятельная некоммерческая общественная структура;</li>
              <li>· сфера культуры, просвещения и оздоровительной культуры движения;</li>
              <li>· светская и политически нейтральная инициатива;</li>
              <li>· уважение к традиции, преемственности и безопасности.</li>
            </ul>
          </div>
          <div className="border border-gold-dim bg-ink p-5">
            <h3 className="font-serif text-[18px] font-bold text-paper">
              Это не
            </h3>
            <ul className="mt-3 space-y-2 text-[15px] leading-[1.55] text-paper-muted">
              <li>· не спортивная федерация и не её подразделение;</li>
              <li>· не присваивает спортивные звания и разряды;</li>
              <li>· не проводит официальных спортивных соревнований;</li>
              <li>· не религиозное и не политическое объединение.</li>
            </ul>
          </div>
        </div>
        <p className="mt-5 text-[14px] leading-[1.6] text-paper-muted">
          Философские, исторические и культурные аспекты рассматриваются как
          культурное наследие и предмет изучения, а не как вероучение. Практики
          описываются языком физиологии, движения, дыхания и здоровья.
        </p>
      </section>

      <Rule />

      {/* Предмет деятельности */}
      <section>
        <Label>Предмет деятельности</Label>
        <H2>Направления работы</H2>
        <div className="mt-6 space-y-4">
          {AREAS.map((a) => (
            <div
              key={a.title}
              className="border-t border-ink-muted pt-4"
            >
              <h3 className="font-serif text-[19px] font-bold text-gold">
                {a.title}
              </h3>
              <p className="mt-1.5 text-[15px] leading-[1.6] text-paper-muted">
                {a.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      {/* Признание преподавателей */}
      <section>
        <Label>Признание преподавателей</Label>
        <H2>Прозрачная система статусов</H2>
        <p className="mt-4 text-[15px] leading-[1.6] text-paper-muted">
          Ассоциация не копирует спортивные звания. Признание строится на опыте,
          подтверждённой преемственности обучения и решении методического
          совета — как ступени профессии, а не государственные разряды.
        </p>
        <ol className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-3">
          {STATUSES.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className="border border-gold-dim px-4 py-2 font-serif text-[16px] text-paper">
                {s}
              </span>
              {i < STATUSES.length - 1 && (
                <span aria-hidden className="text-gold-dim">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <Rule />

      {/* Этический кодекс */}
      <section>
        <Label>Этический кодекс</Label>
        <H2>Принципы, обязательные для всех</H2>
        <ul className="mt-6 space-y-3">
          {ETHICS.map((e) => (
            <li
              key={e}
              className="border-l-2 border-gold-dim pl-4 text-[15px] leading-[1.55] text-paper"
            >
              {e}
            </li>
          ))}
        </ul>
      </section>

      <Rule />

      {/* Брендовая архитектура */}
      <section>
        <Label>Брендовая архитектура</Label>
        <H2>Три уровня, ясно разграниченные</H2>
        <div className="mt-6 space-y-4">
          <Tier
            mark="會"
            name="Ассоциация (АТВИ)"
            role="Институциональный уровень — миссия, этика, признание преподавателей, международные связи. Некоммерческая структура."
          />
          <Tier
            mark="功"
            name="KUNGFU MAN"
            role="Авторская школа и медиабренд основателя. Коммерческая деятельность (ИП), юридически и бухгалтерски отделённая от Ассоциации. Её обслуживает эта платформа."
          />
          <Tier
            mark="藝"
            name="Программы"
            role="Тайцзицюань, Нэйгун, Цигун, традиционный Винчун, Джиткундо, структура тела и дыхание."
          />
        </div>
      </section>

      <Rule />

      {/* Международное сотрудничество */}
      <section className="text-center">
        <Label>Международное сотрудничество</Label>
        <p className="mx-auto max-w-[34em] text-[15px] leading-[1.65] text-paper-muted">
          В пределах законодательства Республики Таджикистан рассматриваются
          культурные и профессиональные связи: национальное членство в
          Международной федерации оздоровительного цигуна (IHQF, Пекин),
          международная сертификация преподавателей оздоровительного цигуна и
          сотрудничество с культурно-образовательными центрами КНР, включая
          Институт Конфуция.
        </p>
      </section>

      {/* Финальная оговорка */}
      <div className="mt-16 border-t border-ink-muted pt-8 text-center">
        <p className="mx-auto max-w-[36em] text-[13px] leading-[1.6] text-paper-muted">
          Материал носит информационный характер и описывает проект будущей
          организации. Он не утверждает наличие зарегистрированного
          юридического статуса и не является публичной офертой. Практики
          Ассоциации и школы — оздоровительные; они не заменяют медицинскую
          помощь.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-[14px] text-gold hover:underline"
        >
          ← К школе KUNGFU MAN
        </Link>
      </div>
    </main>
  );
}

function Tier({
  mark,
  name,
  role,
}: {
  mark: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-start gap-4 border border-gold-dim bg-ink p-5">
      <span
        aria-hidden
        className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-gold-dim font-serif text-[22px] text-gold"
      >
        {mark}
      </span>
      <div>
        <h3 className="font-serif text-[19px] font-bold text-paper">{name}</h3>
        <p className="mt-1 text-[14px] leading-[1.55] text-paper-muted">
          {role}
        </p>
      </div>
    </div>
  );
}

const AREAS: { title: string; body: string }[] = [
  {
    title: "Внутренние искусства",
    body: "Тайцзицюань, Нэйгун, Цигун (в том числе оздоровительный), дыхательно-двигательные практики, работа со структурой тела, расслабление и контроль напряжения.",
  },
  {
    title: "Традиционные системы движения",
    body: "Традиционный Винчун и Джиткундо как культурное наследие — методология, терминология и преемственность. Без спортивных соревнований и подготовки спортсменов.",
  },
  {
    title: "Оздоровительная культура движения",
    body: "Осознанное движение, дыхательная работа, координация и баланс, двигательная профилактика и телесная осознанность — с опорой на современную физиологию, без медицинских обещаний.",
  },
  {
    title: "Просвещение и образование",
    body: "Семинары и практикумы, методические материалы, архивные и исследовательские проекты, культурно-просветительские встречи.",
  },
];

const STATUSES = [
  "практик",
  "старший практик",
  "преподаватель",
  "старший преподаватель",
  "наставник",
];

const ETHICS = [
  "Не выдавать себя за представителя государственной структуры или федерации.",
  "Не присваивать чужие школы, преемственность и авторство.",
  "Не давать медицинских обещаний и не заниматься лечебной деятельностью без соответствующих разрешений.",
  "Не использовать страх, мистификацию или заявления о сверхспособностях.",
  "Уважать возраст, здоровье и индивидуальные ограничения занимающихся.",
  "Не унижать другие школы и преподавателей; точно обозначать фактический статус в публичных материалах.",
];
