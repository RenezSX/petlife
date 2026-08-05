import {
  CheckCircle2,
  Clock3,
  Edit3,
  PlayCircle,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { Modal } from '../components/Modal';
import { api } from '../services/api';
import type {
  ProcedureItem,
  ProcedureStats,
} from '../types';

type HospitalizationOption = {
  id: string;
  animal: {
    name: string;
    tutor?: {
      name: string;
    } | null;
  };
  bed?: {
    name: string;
  } | null;
};

type ProcedureForm = {
  hospitalizationId: string;
  title: string;
  description: string;
  responsible: string;
  scheduledAt: string;
  notes: string;
};

const labels: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};

const emptyForm: ProcedureForm = {
  hospitalizationId: '',
  title: '',
  description: '',
  responsible: '',
  scheduledAt: '',
  notes: '',
};

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);
}

function getErrorMessage(error: unknown) {
  const responseError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return (
    responseError.response?.data?.message ??
    'Não foi possível concluir a operação.'
  );
}

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === 'object'
  ) {
    const objectData = data as {
      items?: unknown;
      hospitalizations?: unknown;
    };

    if (Array.isArray(objectData.items)) {
      return objectData.items as T[];
    }

    if (Array.isArray(objectData.hospitalizations)) {
      return objectData.hospitalizations as T[];
    }
  }

  return [];
}

export function ProceduresPage() {
  const [items, setItems] = useState<ProcedureItem[]>([]);
  const [stats, setStats] = useState<ProcedureStats | null>(null);
  const [options, setOptions] = useState<HospitalizationOption[]>([]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [editing, setEditing] = useState<
    ProcedureItem | null | undefined
  >(undefined);

  const [form, setForm] = useState<ProcedureForm>(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [
        proceduresResponse,
        statsResponse,
        optionsResponse,
      ] = await Promise.all([
        api.get('/procedures', {
          params: {
            search,
            status,
            date,
          },
        }),
        api.get('/procedures/stats'),
        api.get('/hospitalizations', {
  params: {
    status: 'active',
    pageSize: 100,
  },
})
      ]);

      setItems(
        normalizeArray<ProcedureItem>(
          proceduresResponse.data,
        ),
      );

      setStats(statsResponse.data);

      setOptions(
        normalizeArray<HospitalizationOption>(
          optionsResponse.data,
        ),
      );
    } catch (loadError) {
      console.error(
        'Erro ao carregar procedimentos:',
        loadError,
      );

      setItems([]);
      setOptions([]);
      setError(
        'Não foi possível carregar os procedimentos.',
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, date]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 180);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [load]);

  function openProcedureModal(
    item?: ProcedureItem,
  ) {
    setEditing(item ?? null);
    setError('');

    if (item) {
      setForm({
        hospitalizationId:
          item.hospitalizationId,
        title: item.title,
        description: item.description ?? '',
        responsible: item.responsible ?? '',
        scheduledAt: toLocalDateTimeInput(
          item.scheduledAt,
        ),
        notes: item.notes ?? '',
      });

      return;
    }

    setForm({
      ...emptyForm,
      scheduledAt: toLocalDateTimeInput(
        new Date().toISOString(),
      ),
    });
  }

  function closeProcedureModal() {
    if (submitting) {
      return;
    }

    setEditing(undefined);
    setError('');
    setForm(emptyForm);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.hospitalizationId) {
      setError(
        'Selecione uma internação ativa.',
      );
      return;
    }

    if (!form.scheduledAt) {
      setError(
        'Informe a data e o horário.',
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        hospitalizationId:
          form.hospitalizationId,
        title: form.title.trim(),
        description:
          form.description.trim() || null,
        responsible:
          form.responsible.trim() || null,
        scheduledAt: new Date(
          form.scheduledAt,
        ).toISOString(),
        notes: form.notes.trim() || null,
      };

      if (editing) {
        await api.put(
          `/procedures/${editing.id}`,
          payload,
        );
      } else {
        await api.post(
          '/procedures',
          payload,
        );
      }

      closeProcedureModal();
      await load();
    } catch (submitError) {
      console.error(
        'Erro ao salvar procedimento:',
        submitError,
      );

      setError(
        getErrorMessage(submitError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(
    id: string,
    nextStatus: string,
  ) {
    try {
      setError('');

      await api.patch(
        `/procedures/${id}/status`,
        {
          status: nextStatus,
        },
      );

      await load();
    } catch (statusError) {
      console.error(
        'Erro ao atualizar status:',
        statusError,
      );

      setError(
        getErrorMessage(statusError),
      );
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            ROTINA CLÍNICA
          </p>

          <h1>Procedimentos</h1>

          <p className="muted">
            Organize tarefas, horários e
            responsáveis dos pacientes internados.
          </p>
        </div>

        <button
          type="button"
          className="primary-button button-with-icon"
          onClick={() =>
            openProcedureModal()
          }
        >
          <Plus />
          Novo procedimento
        </button>
      </div>

      {stats && (
        <div className="mini-metrics">
          <article>
            <Clock3 />

            <div>
              <strong>{stats.today}</strong>
              <span>Agendados hoje</span>
            </div>
          </article>

          <article>
            <PlayCircle />

            <div>
              <strong>{stats.pending}</strong>
              <span>Pendentes</span>
            </div>
          </article>

          <article>
            <CheckCircle2 />

            <div>
              <strong>
                {stats.completed}
              </strong>
              <span>Concluídos hoje</span>
            </div>
          </article>

          <article>
            <XCircle />

            <div>
              <strong>{stats.overdue}</strong>
              <span>Atrasados</span>
            </div>
          </article>
        </div>
      )}

      <section className="panel">
        <div className="toolbar toolbar-wrap">
          <div className="search-box">
            <Search />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar procedimento, paciente ou responsável"
            />
          </div>

          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="all">
              Todos os status
            </option>

            <option value="PENDING">
              Pendentes
            </option>

            <option value="IN_PROGRESS">
              Em andamento
            </option>

            <option value="COMPLETED">
              Concluídos
            </option>

            <option value="CANCELED">
              Cancelados
            </option>
          </select>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="agenda-list">
          {loading ? (
            <div className="empty-state">
              <Clock3 size={40} />
              <h3>Carregando...</h3>
              <p>
                Buscando os procedimentos.
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <ClipboardIcon />

              <h3>
                Nenhum procedimento
              </h3>

              <p>
                Cadastre uma tarefa clínica ou
                altere a data.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <article
                className={`agenda-item status-border-${item.status.toLowerCase()}`}
                key={item.id}
              >
                <div className="agenda-time">
                  <strong>
                    {new Date(
                      item.scheduledAt,
                    ).toLocaleTimeString(
                      'pt-BR',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </strong>

                  <span>
                    {new Date(
                      item.scheduledAt,
                    ).toLocaleDateString(
                      'pt-BR',
                    )}
                  </span>
                </div>

                <div className="agenda-main">
                  <div className="agenda-title">
                    <h3>{item.title}</h3>

                    <span
                      className={`status ${item.status.toLowerCase()}`}
                    >
                      {labels[item.status] ??
                        item.status}
                    </span>
                  </div>

                  <p>
                    {item.hospitalization
                      ?.animal?.name ??
                      'Paciente não informado'}
                    {' • '}
                    {item.hospitalization
                      ?.animal?.tutor?.name ??
                      'Tutor não informado'}

                    {item.hospitalization?.bed
                      ? ` • ${item.hospitalization.bed.name}`
                      : ''}
                  </p>

                  {item.description && (
                    <small>
                      {item.description}
                    </small>
                  )}

                  <div className="agenda-meta">
                    Responsável:{' '}

                    <strong>
                      {item.responsible ||
                        'Não definido'}
                    </strong>
                  </div>
                </div>

                <div className="row-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      openProcedureModal(item)
                    }
                    title="Editar"
                  >
                    <Edit3 />
                  </button>

                  {item.status === 'PENDING' && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        void changeStatus(
                          item.id,
                          'IN_PROGRESS',
                        )
                      }
                    >
                      Iniciar
                    </button>
                  )}

                  {item.status !==
                    'COMPLETED' &&
                    item.status !==
                      'CANCELED' && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          void changeStatus(
                            item.id,
                            'COMPLETED',
                          )
                        }
                      >
                        Concluir
                      </button>
                    )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {editing !== undefined && (
        <Modal
          title={
            editing
              ? 'Editar procedimento'
              : 'Novo procedimento'
          }
          subtitle="Agende uma atividade para uma internação ativa."
          onClose={closeProcedureModal}
          wide
        >
          <form
            className="entity-form"
            onSubmit={submit}
          >
            <div className="form-grid">
              <label>
                Internação *

                <select
                  required
                  disabled={Boolean(editing)}
                  value={
                    form.hospitalizationId
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      hospitalizationId:
                        event.target.value,
                    }))
                  }
                >
                  <option value="">
                    Selecione o paciente
                  </option>

                  {options.map(
                    (hospitalization) => (
                      <option
                        key={
                          hospitalization.id
                        }
                        value={
                          hospitalization.id
                        }
                      >
                        {hospitalization.animal
                          ?.name ??
                          'Paciente'}
                        {' • '}
                        {hospitalization.animal
                          ?.tutor?.name ??
                          'Tutor não informado'}

                        {hospitalization.bed
                          ? ` • ${hospitalization.bed.name}`
                          : ''}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Procedimento *

                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title:
                        event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Responsável

                <input
                  value={form.responsible}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      responsible:
                        event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Data e hora *

                <input
                  required
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      scheduledAt:
                        event.target.value,
                    }))
                  }
                />
              </label>

              <label className="full">
                Descrição

                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description:
                        event.target.value,
                    }))
                  }
                />
              </label>

              <label className="full">
                Observações

                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes:
                        event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            {options.length === 0 && (
              <div className="form-error">
                Nenhuma internação ativa foi
                encontrada. Crie uma internação antes
                de cadastrar um procedimento.
              </div>
            )}

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="form-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={closeProcedureModal}
                disabled={submitting}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  submitting ||
                  options.length === 0
                }
              >
                {submitting
                  ? 'Salvando...'
                  : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function ClipboardIcon() {
  return <Clock3 size={40} />;
}