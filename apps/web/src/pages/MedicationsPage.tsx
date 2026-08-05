import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PauseCircle,
  Pill,
  Plus,
  Syringe,
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
  MedicationDose,
  MedicationPrescription,
  MedicationStats,
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
    sector?: string;
  } | null;
};

type PrescriptionForm = {
  hospitalizationId: string;
  medication: string;
  dose: string;
  unit: string;
  route: string;
  frequencyHours: number;
  startAt: string;
  endAt: string;
  notes: string;
};

type AdministrationForm = {
  status: string;
  administeredBy: string;
  notes: string;
};

const emptyForm: PrescriptionForm = {
  hospitalizationId: '',
  medication: '',
  dose: '',
  unit: 'mg',
  route: 'Oral',
  frequencyHours: 8,
  startAt: '',
  endAt: '',
  notes: '',
};

const emptyAdministration: AdministrationForm = {
  status: 'ADMINISTERED',
  administeredBy: '',
  notes: '',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  ADMINISTERED: 'Administrada',
  NOT_ADMINISTERED: 'Não administrada',
  REFUSED: 'Recusada',
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

  if (data && typeof data === 'object') {
    const objectData = data as {
      items?: unknown;
      hospitalizations?: unknown;
      prescriptions?: unknown;
      doses?: unknown;
    };

    if (Array.isArray(objectData.items)) {
      return objectData.items as T[];
    }

    if (Array.isArray(objectData.hospitalizations)) {
      return objectData.hospitalizations as T[];
    }

    if (Array.isArray(objectData.prescriptions)) {
      return objectData.prescriptions as T[];
    }

    if (Array.isArray(objectData.doses)) {
      return objectData.doses as T[];
    }
  }

  return [];
}

export function MedicationsPage() {
  const [prescriptions, setPrescriptions] = useState<
    MedicationPrescription[]
  >([]);

  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [stats, setStats] = useState<MedicationStats | null>(
    null,
  );

  const [options, setOptions] = useState<
    HospitalizationOption[]
  >([]);

  const [tab, setTab] = useState<
    'agenda' | 'prescricoes'
  >('agenda');

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [modalOpen, setModalOpen] = useState(false);

  const [doseModal, setDoseModal] =
    useState<MedicationDose | null>(null);

  const [form, setForm] =
    useState<PrescriptionForm>(emptyForm);

  const [administration, setAdministration] =
    useState<AdministrationForm>(emptyAdministration);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [
        prescriptionsResponse,
        dosesResponse,
        statsResponse,
        optionsResponse,
      ] = await Promise.all([
        api.get('/medications/prescriptions'),
        api.get('/medications/doses', {
          params: { date },
        }),
        api.get('/medications/stats'),
        api.get('/hospitalizations', {
  params: {
    status: 'active',
    pageSize: 100,
  },
})
      ]);

      setPrescriptions(
        normalizeArray<MedicationPrescription>(
          prescriptionsResponse.data,
        ),
      );

      setDoses(
        normalizeArray<MedicationDose>(
          dosesResponse.data,
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
        'Erro ao carregar medicações:',
        loadError,
      );

      setPrescriptions([]);
      setDoses([]);
      setOptions([]);

      setError(
        'Não foi possível carregar as medicações.',
      );
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  function openPrescriptionModal() {
    setForm({
      ...emptyForm,
      hospitalizationId: '',
      startAt: toLocalDateTimeInput(
        new Date().toISOString(),
      ),
    });

    setError('');
    setModalOpen(true);
  }

  function closePrescriptionModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setForm(emptyForm);
    setError('');
  }

  function openDoseModal(dose: MedicationDose) {
    setDoseModal(dose);
    setAdministration(emptyAdministration);
    setError('');
  }

  function closeDoseModal() {
    if (submitting) {
      return;
    }

    setDoseModal(null);
    setAdministration(emptyAdministration);
    setError('');
  }

  async function submitPrescription(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.hospitalizationId) {
      setError('Selecione uma internação ativa.');
      return;
    }

    if (!form.startAt) {
      setError('Informe o início da prescrição.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await api.post('/medications/prescriptions', {
        hospitalizationId: form.hospitalizationId,
        medication: form.medication.trim(),
        dose: form.dose.trim(),
        unit: form.unit,
        route: form.route,
        frequencyHours: Number(form.frequencyHours),
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt
          ? new Date(form.endAt).toISOString()
          : null,
        notes: form.notes.trim() || null,
      });

      closePrescriptionModal();
      await load();
    } catch (submitError) {
      console.error(
        'Erro ao criar prescrição:',
        submitError,
      );

      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function administerDose(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!doseModal) {
      return;
    }

    if (
      administration.status !== 'ADMINISTERED' &&
      !administration.notes.trim()
    ) {
      setError(
        'Informe uma justificativa para dose não administrada ou recusada.',
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await api.patch(
        `/medications/doses/${doseModal.id}/administer`,
        {
          status: administration.status,
          administeredBy:
            administration.administeredBy.trim(),
          notes: administration.notes.trim() || null,
        },
      );

      closeDoseModal();
      await load();
    } catch (administrationError) {
      console.error(
        'Erro ao registrar dose:',
        administrationError,
      );

      setError(
        getErrorMessage(administrationError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePrescription(
    prescription: MedicationPrescription,
  ) {
    try {
      setError('');

      const action = prescription.active
        ? 'suspend'
        : 'activate';

      await api.patch(
        `/medications/prescriptions/${prescription.id}/${action}`,
      );

      await load();
    } catch (toggleError) {
      console.error(
        'Erro ao atualizar prescrição:',
        toggleError,
      );

      setError(getErrorMessage(toggleError));
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            TERAPIA MEDICAMENTOSA
          </p>

          <h1>Medicações</h1>

          <p className="muted">
            Prescrições, horários e registro seguro
            da administração.
          </p>
        </div>

        <button
          type="button"
          className="primary-button button-with-icon"
          onClick={openPrescriptionModal}
        >
          <Plus />
          Nova prescrição
        </button>
      </div>

      {stats && (
        <div className="mini-metrics">
          <article>
            <Clock3 />

            <div>
              <strong>{stats.next}</strong>
              <span>Próximas 6 horas</span>
            </div>
          </article>

          <article>
            <AlertTriangle />

            <div>
              <strong>{stats.overdue}</strong>
              <span>Doses atrasadas</span>
            </div>
          </article>

          <article>
            <Pill />

            <div>
              <strong>{stats.pending}</strong>
              <span>Doses pendentes</span>
            </div>
          </article>

          <article>
            <CheckCircle2 />

            <div>
              <strong>{stats.administered}</strong>
              <span>Total administradas</span>
            </div>
          </article>
        </div>
      )}

      <div className="segmented">
        <button
          type="button"
          className={tab === 'agenda' ? 'active' : ''}
          onClick={() => setTab('agenda')}
        >
          Agenda de doses
        </button>

        <button
          type="button"
          className={
            tab === 'prescricoes' ? 'active' : ''
          }
          onClick={() => setTab('prescricoes')}
        >
          Prescrições
        </button>
      </div>

      {error && (
        <div className="form-error">{error}</div>
      )}

      {tab === 'agenda' ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Agenda diária</h2>
              <p>Doses organizadas por horário.</p>
            </div>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />
          </div>

          <div className="dose-list">
            {loading ? (
              <div className="empty-state">
                <Syringe size={40} />
                <h3>Carregando...</h3>
                <p>Buscando a agenda de doses.</p>
              </div>
            ) : doses.length === 0 ? (
              <div className="empty-state">
                <Syringe size={40} />
                <h3>Nenhuma dose nesta data</h3>
                <p>
                  Crie uma prescrição ou altere a
                  data selecionada.
                </p>
              </div>
            ) : (
              doses.map((dose) => {
                const overdue =
                  dose.status === 'PENDING' &&
                  new Date(dose.scheduledAt) <
                    new Date();

                return (
                  <article
                    className={`dose-item ${dose.status.toLowerCase()} ${
                      overdue ? 'overdue' : ''
                    }`}
                    key={dose.id}
                  >
                    <div className="dose-time">
                      <strong>
                        {new Date(
                          dose.scheduledAt,
                        ).toLocaleTimeString(
                          'pt-BR',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </strong>

                      <span>{dose.route}</span>
                    </div>

                    <div className="dose-main">
                      <h3>{dose.medication}</h3>

                      <p>
                        {dose.dose} {dose.unit}
                        {' • '}
                        {dose.hospitalization?.animal
                          ?.name ??
                          'Paciente não informado'}
                        {' • '}
                        {dose.hospitalization?.animal
                          ?.tutor?.name ??
                          'Tutor não informado'}
                      </p>

                      <small>
                        {dose.hospitalization?.bed
                          ? `${
                              dose.hospitalization.bed
                                .sector ??
                              'Setor não informado'
                            } • ${
                              dose.hospitalization.bed
                                .name
                            }`
                          : 'Sem leito'}
                      </small>
                    </div>

                    <span
                      className={`status ${dose.status.toLowerCase()}`}
                    >
                      {statusLabels[dose.status] ??
                        dose.status}
                    </span>

                    {dose.status === 'PENDING' && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          openDoseModal(dose)
                        }
                      >
                        Registrar
                      </button>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      ) : (
        <section className="prescription-grid">
          {loading ? (
            <div className="empty-state">
              <Pill size={40} />
              <h3>Carregando...</h3>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="empty-state">
              <Pill size={40} />
              <h3>Nenhuma prescrição</h3>
              <p>
                Crie uma prescrição para uma
                internação ativa.
              </p>
            </div>
          ) : (
            prescriptions.map((prescription) => (
              <article
                className={`prescription-card ${
                  prescription.active ? '' : 'inactive'
                }`}
                key={prescription.id}
              >
                <header>
                  <div className="prescription-icon">
                    <Pill />
                  </div>

                  <div>
                    <h3>{prescription.medication}</h3>

                    <p>
                      {prescription.dose}{' '}
                      {prescription.unit}
                      {' • '}
                      {prescription.route}
                    </p>
                  </div>

                  <span
                    className={`status ${
                      prescription.active
                        ? 'hospitalized'
                        : 'canceled'
                    }`}
                  >
                    {prescription.active
                      ? 'Ativa'
                      : 'Suspensa'}
                  </span>
                </header>

                <div className="prescription-patient">
                  <strong>
                    {prescription.hospitalization
                      ?.animal?.name ??
                      'Paciente não informado'}
                  </strong>

                  <span>
                    {prescription.hospitalization
                      ?.animal?.tutor?.name ??
                      'Tutor não informado'}
                  </span>
                </div>

                <dl>
                  <div>
                    <dt>Frequência</dt>
                    <dd>
                      A cada{' '}
                      {prescription.frequencyHours}h
                    </dd>
                  </div>

                  <div>
                    <dt>Início</dt>
                    <dd>
                      {new Date(
                        prescription.startAt,
                      ).toLocaleString('pt-BR')}
                    </dd>
                  </div>

                  <div>
                    <dt>Término</dt>
                    <dd>
                      {prescription.endAt
                        ? new Date(
                            prescription.endAt,
                          ).toLocaleString('pt-BR')
                        : 'Contínuo'}
                    </dd>
                  </div>
                </dl>

                <footer>
                  <button
                    type="button"
                    className="secondary-button button-with-icon"
                    onClick={() =>
                      void togglePrescription(
                        prescription,
                      )
                    }
                  >
                    <PauseCircle />

                    {prescription.active
                      ? 'Suspender'
                      : 'Reativar'}
                  </button>
                </footer>
              </article>
            ))
          )}
        </section>
      )}

      {modalOpen && (
        <Modal
          title="Nova prescrição"
          subtitle="O sistema gera automaticamente os horários das doses."
          onClose={closePrescriptionModal}
          wide
        >
          <form
            className="entity-form"
            onSubmit={submitPrescription}
          >
            <div className="form-grid three-cols">
              <label className="full">
                Internação *

                <select
                  required
                  value={form.hospitalizationId}
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
                Medicamento *

                <input
                  required
                  value={form.medication}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      medication:
                        event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Dose *

                <input
                  required
                  value={form.dose}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dose: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Unidade *

                <select
                  value={form.unit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unit: event.target.value,
                    }))
                  }
                >
                  <option value="mg">mg</option>
                  <option value="ml">ml</option>
                  <option value="comprimido">
                    comprimido
                  </option>
                  <option value="gota">gota</option>
                  <option value="UI">UI</option>
                </select>
              </label>

              <label>
                Via

                <select
                  value={form.route}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      route: event.target.value,
                    }))
                  }
                >
                  <option value="Oral">Oral</option>
                  <option value="Intravenosa">
                    Intravenosa
                  </option>
                  <option value="Intramuscular">
                    Intramuscular
                  </option>
                  <option value="Subcutânea">
                    Subcutânea
                  </option>
                  <option value="Tópica">
                    Tópica
                  </option>
                  <option value="Oftálmica">
                    Oftálmica
                  </option>
                  <option value="Inalatória">
                    Inalatória
                  </option>
                </select>
              </label>

              <label>
                Frequência (horas)

                <input
                  type="number"
                  min="1"
                  max="168"
                  value={form.frequencyHours}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      frequencyHours: Number(
                        event.target.value,
                      ),
                    }))
                  }
                />
              </label>

              <label>
                Início *

                <input
                  required
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startAt:
                        event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Término

                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endAt:
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
                de cadastrar uma prescrição.
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
                onClick={closePrescriptionModal}
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
                  ? 'Criando...'
                  : 'Criar prescrição'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {doseModal && (
        <Modal
          title="Registrar dose"
          subtitle={`${
            doseModal.medication
          } • ${
            doseModal.hospitalization?.animal
              ?.name ?? 'Paciente'
          }`}
          onClose={closeDoseModal}
        >
          <form
            className="entity-form"
            onSubmit={administerDose}
          >
            <div className="form-grid">
              <label>
                Status

                <select
                  value={administration.status}
                  onChange={(event) =>
                    setAdministration(
                      (current) => ({
                        ...current,
                        status:
                          event.target.value,
                      }),
                    )
                  }
                >
                  <option value="ADMINISTERED">
                    Administrada
                  </option>

                  <option value="NOT_ADMINISTERED">
                    Não administrada
                  </option>

                  <option value="REFUSED">
                    Recusada
                  </option>
                </select>
              </label>

              <label>
                Responsável *

                <input
                  required
                  value={
                    administration.administeredBy
                  }
                  onChange={(event) =>
                    setAdministration(
                      (current) => ({
                        ...current,
                        administeredBy:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label className="full">
                Observação / justificativa

                <textarea
                  rows={3}
                  value={administration.notes}
                  required={
                    administration.status !==
                    'ADMINISTERED'
                  }
                  onChange={(event) =>
                    setAdministration(
                      (current) => ({
                        ...current,
                        notes:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="form-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={closeDoseModal}
                disabled={submitting}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
              >
                {submitting
                  ? 'Registrando...'
                  : 'Confirmar registro'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}