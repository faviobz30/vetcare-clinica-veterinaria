package pe.edu.utec.vetcare.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import pe.edu.utec.vetcare.dto.request.CreateCitaRequest;
import pe.edu.utec.vetcare.dto.request.UpdateCitaRequest;
import pe.edu.utec.vetcare.dto.response.CitaResponse;
import pe.edu.utec.vetcare.entity.CitaEntity;
import pe.edu.utec.vetcare.entity.MascotaEntity;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;
import pe.edu.utec.vetcare.enums.EstadoCita;
import pe.edu.utec.vetcare.exception.CitaHorarioOcupadoException;
import pe.edu.utec.vetcare.exception.EstadoCitaInvalidoException;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.CitaMapper;
import pe.edu.utec.vetcare.repository.CitaRepository;
import pe.edu.utec.vetcare.repository.MascotaRepository;
import pe.edu.utec.vetcare.repository.VeterinarioRepository;
import pe.edu.utec.vetcare.service.CitaService;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CitaServiceImpl implements CitaService {

    private final CitaRepository citaRepository;
    private final VeterinarioRepository veterinarioRepository;
    private final MascotaRepository mascotaRepository;
    private final CitaMapper citaMapper;

    public CitaServiceImpl(
            CitaRepository citaRepository,
            VeterinarioRepository veterinarioRepository,
            MascotaRepository mascotaRepository,
            CitaMapper citaMapper
    ) {
        this.citaRepository = citaRepository;
        this.veterinarioRepository = veterinarioRepository;
        this.mascotaRepository = mascotaRepository;
        this.citaMapper = citaMapper;
    }

    @Override
    public List<CitaResponse> getAll() {

        return citasVisibles()
                .stream()
                .map(citaMapper::toResponse)
                .toList();
    }

    @Override
    public CitaResponse getById(Long id) {

        CitaEntity entity =
                citaRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Cita no encontrada"
                                )
                        );

        comprobarLectura(entity);
        return citaMapper.toResponse(entity);
    }

    @Override
    public CitaResponse create(
            CreateCitaRequest request) {

        VeterinarioEntity veterinario =
                veterinarioRepository
                        .findById(
                                request.getIdVeterinario()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Veterinario no encontrado"
                                )
                        );

        MascotaEntity mascota =
                mascotaRepository
                        .findById(
                                request.getIdMascota()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Mascota no encontrada"
                                )
                        );

        comprobarCreacion(mascota);

        LocalDateTime inicioComparacion =
                request.getFechaCita()
                        .minusMinutes(30);

        LocalDateTime finNuevaCita =
                request.getFechaCita()
                        .plusMinutes(30);

        boolean existeCita =
                citaRepository.existsCitaSuperpuesta(
                        request.getIdVeterinario(),
                        inicioComparacion,
                        finNuevaCita,
                        EstadoCita.CANCELADA
                );

        if (existeCita) {
            throw new CitaHorarioOcupadoException(
                    "El veterinario ya tiene una cita que se cruza con ese horario"
            );
        }

        CitaEntity entity =
                citaMapper.toEntity(request);

        entity.setVeterinario(veterinario);
        entity.setMascota(mascota);
        entity.setEstado(EstadoCita.PENDIENTE);

        CitaEntity savedEntity =
                citaRepository.save(entity);

        return citaMapper.toResponse(savedEntity);
    }

    @Override
    public CitaResponse update(
            Long id,
            UpdateCitaRequest request) {

        CitaEntity entity =
                citaRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Cita no encontrada"
                                )
                        );

        comprobarActualizacion(entity);

        LocalDateTime inicioComparacion =
                request.getFechaCita()
                        .minusMinutes(30);

        LocalDateTime finNuevaCita =
                request.getFechaCita()
                        .plusMinutes(30);

        boolean existeCita =
                citaRepository.existsOtraCitaSuperpuesta(
                        entity.getVeterinario()
                                .getIdVeterinario(),
                        inicioComparacion,
                        finNuevaCita,
                        EstadoCita.CANCELADA,
                        entity.getIdCita()
                );

        if (existeCita) {

            throw new CitaHorarioOcupadoException(
                    "El veterinario ya tiene una cita que se cruza con ese horario"
            );
        }

        citaMapper.updateEntity(
                request,
                entity
        );

        CitaEntity updatedEntity =
                citaRepository.save(entity);

        return citaMapper.toResponse(updatedEntity);
    }

    @Override
    public void delete(Long id) {

        CitaEntity entity =
                citaRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Cita no encontrada"
                                )
                        );

        comprobarAdministrador();
        if (entity.getEstado() == EstadoCita.ATENDIDA || entity.getEstado() == EstadoCita.CANCELADA) {
            throw new EstadoCitaInvalidoException("No se puede eliminar una cita " + entity.getEstado());
        }
        citaRepository.delete(entity);
    }

    @Override
    public CitaResponse confirm(Long id) {

        CitaEntity entity =
                citaRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Cita no encontrada"
                                )
                        );

        comprobarVeterinarioDeCita(entity);

        if (entity.getEstado()
                != EstadoCita.PENDIENTE) {

            throw new EstadoCitaInvalidoException(
                    "Solo se puede confirmar una cita que esté PENDIENTE"
            );
        }

        entity.setEstado(
                EstadoCita.CONFIRMADA
        );

        return citaMapper.toResponse(
                citaRepository.save(entity)
        );
    }

    @Override
    public CitaResponse cancel(Long id) {

        CitaEntity entity =
                citaRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Cita no encontrada"
                                )
                        );

        comprobarCancelacion(entity);

        if (entity.getEstado()
                != EstadoCita.PENDIENTE
                && entity.getEstado()
                != EstadoCita.CONFIRMADA) {

            throw new EstadoCitaInvalidoException(
                    "Solo se puede cancelar una cita PENDIENTE o CONFIRMADA"
            );
        }

        entity.setEstado(
                EstadoCita.CANCELADA
        );

        return citaMapper.toResponse(
                citaRepository.save(entity)
        );
    }

    @Override
    public CitaResponse attend(Long id) {
        // Se mantiene la ruta por compatibilidad, pero no permite cerrar
        // una consulta sin registrar la atención clínica.
        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));
        comprobarVeterinarioDeCita(entity);
        throw new EstadoCitaInvalidoException(
                "Registre la atención clínica para marcar automáticamente la cita como ATENDIDA"
        );
    }

    // La identidad proviene exclusivamente del JWT validado por Spring Security.
    private Authentication autenticacion() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Se requiere autenticación");
        }
        return auth;
    }

    private boolean esRol(String rol) {
        return autenticacion().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + rol));
    }

    private String correoActual() {
        return autenticacion().getName();
    }

    private List<CitaEntity> citasVisibles() {
        if (esRol("ADMIN")) return citaRepository.findAll();
        if (esRol("VETERINARIO")) return citaRepository.findByCorreoVeterinario(correoActual());
        if (esRol("PROPIETARIO")) return citaRepository.findByCorreoPropietario(correoActual());
        throw new AccessDeniedException("No tiene permiso para consultar citas");
    }

    private boolean esSuVeterinario(CitaEntity cita) {
        return cita.getVeterinario().getUsuario().getCorreo().equals(correoActual());
    }

    private boolean esSuPropietario(CitaEntity cita) {
        return cita.getMascota().getPropietario().getUsuario().getCorreo().equals(correoActual());
    }

    private void comprobarLectura(CitaEntity cita) {
        if (esRol("ADMIN") || (esRol("VETERINARIO") && esSuVeterinario(cita))
                || (esRol("PROPIETARIO") && esSuPropietario(cita))) return;
        throw new AccessDeniedException("No puede consultar esta cita");
    }

    private void comprobarCreacion(MascotaEntity mascota) {
        if (esRol("ADMIN")) return;
        if (esRol("PROPIETARIO") && mascota.getPropietario().getUsuario().getCorreo().equals(correoActual())) return;
        throw new AccessDeniedException("Solo puede crear citas para sus propias mascotas");
    }

    private void comprobarActualizacion(CitaEntity cita) {
        if (esRol("ADMIN")) return;
        if (esRol("PROPIETARIO") && esSuPropietario(cita)
                && cita.getEstado() == EstadoCita.PENDIENTE) return;
        throw new AccessDeniedException("No puede actualizar esta cita");
    }

    private void comprobarVeterinarioDeCita(CitaEntity cita) {
        if (esRol("ADMIN") || (esRol("VETERINARIO") && esSuVeterinario(cita))) return;
        throw new AccessDeniedException("Solo el veterinario asignado o ADMIN puede realizar esta operación");
    }

    private void comprobarCancelacion(CitaEntity cita) {
        if (esRol("ADMIN") || (esRol("PROPIETARIO") && esSuPropietario(cita))) return;
        throw new AccessDeniedException("No puede cancelar esta cita");
    }

    private void comprobarAdministrador() {
        if (!esRol("ADMIN")) throw new AccessDeniedException("Operación exclusiva de ADMIN");
    }
}
