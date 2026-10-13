package pe.edu.utec.vetcare.service.impl;

import org.springframework.stereotype.Service;
import pe.edu.utec.vetcare.dto.request.CreateCitaRequest;
import pe.edu.utec.vetcare.dto.request.UpdateCitaRequest;
import pe.edu.utec.vetcare.dto.response.CitaResponse;
import pe.edu.utec.vetcare.entity.CitaEntity;
import pe.edu.utec.vetcare.entity.MascotaEntity;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;
import pe.edu.utec.vetcare.enums.EstadoCita;
import pe.edu.utec.vetcare.exception.CitaHorarioOcupadoException;
import pe.edu.utec.vetcare.exception.EstadoCitaInvalidoException;
import pe.edu.utec.vetcare.mapper.CitaMapper;
import pe.edu.utec.vetcare.repository.CitaRepository;
import pe.edu.utec.vetcare.repository.MascotaRepository;
import pe.edu.utec.vetcare.repository.VeterinarioRepository;
import pe.edu.utec.vetcare.service.CitaService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

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
    @Transactional(readOnly = true)
    public List<CitaResponse> getAll() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String correo = authentication.getName();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean esVeterinario = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_VETERINARIO"));

        boolean esPropietario = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PROPIETARIO"));

        return citaRepository.findAll()
                .stream()
                .filter(cita -> {

                    // ADMIN ve todas
                    if (esAdmin) {return true;}

                    // VETERINARIO ve solo las citas asignadas a él
                    if (esVeterinario) {
                        return cita.getVeterinario()
                                .getUsuario()
                                .getCorreo()
                                .equalsIgnoreCase(correo);
                    }

                    // PROPIETARIO ve solo citas de sus propias mascotas
                    if (esPropietario) {
                        return cita.getMascota()
                                .getPropietario()
                                .getUsuario()
                                .getCorreo()
                                .equalsIgnoreCase(correo);
                    }

                    return false;
                })
                .map(citaMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CitaResponse getById(Long id) {

        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        validarAccesoConsulta(entity);

        return citaMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public CitaResponse create(CreateCitaRequest request) {

        // 1. Obtener usuario autenticado
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String correo = authentication.getName();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                );

        boolean esPropietario = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_PROPIETARIO")
                );

        // 2. Buscar veterinario
        VeterinarioEntity veterinario = veterinarioRepository.findById(request.getIdVeterinario()
                ).orElseThrow(() -> new RuntimeException("Veterinario no encontrado"));

        // 3. Buscar mascota
        MascotaEntity mascota = mascotaRepository.findById(request.getIdMascota()
                ).orElseThrow(() -> new RuntimeException("Mascota no encontrada"));

        // 4. Si es PROPIETARIO, verificar que la mascota sea suya
        if (esPropietario) {
            String correoPropietarioMascota =
                    mascota.getPropietario()
                            .getUsuario()
                            .getCorreo();

            if (!correoPropietarioMascota.equalsIgnoreCase(correo)) {
                throw new AccessDeniedException(
                        "No puedes crear una cita para una mascota que no te pertenece");
            }
        }

        // 5. Solamente ADMIN o PROPIETARIO pueden crear citas
        if (!esAdmin && !esPropietario) {
            throw new AccessDeniedException("No tienes permiso para crear citas");
        }

        // 6. Validar que no exista cruce de horarios
        LocalDateTime inicioComparacion = request.getFechaCita().minusMinutes(30);

        LocalDateTime finNuevaCita = request.getFechaCita().plusMinutes(30);

        boolean existeCita = citaRepository.existsCitaSuperpuesta(
                        request.getIdVeterinario(),
                        inicioComparacion,
                        finNuevaCita
                );

        if (existeCita) {
            throw new CitaHorarioOcupadoException(
                    "El veterinario ya tiene una cita que se cruza con ese horario");
        }

        // 7. Crear cita
        CitaEntity entity = citaMapper.toEntity(request);

        entity.setVeterinario(veterinario);
        entity.setMascota(mascota);
        entity.setEstado(EstadoCita.PENDIENTE);

        // 8. Guardar
        CitaEntity savedEntity = citaRepository.save(entity);

        // 9. Devolver respuesta
        return citaMapper.toResponse(savedEntity);
    }

    @Override
    @Transactional
    public CitaResponse update(Long id, UpdateCitaRequest request) {

        // 1. Buscar la cita
        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        // 2. Obtener usuario autenticado
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String correo = authentication.getName();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                );

        boolean esPropietario = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_PROPIETARIO")
                );

        // 3. Si es propietario, comprobar que la cita sea de su propia mascota
        if (esPropietario) {

            String correoPropietario =
                    entity.getMascota()
                            .getPropietario()
                            .getUsuario()
                            .getCorreo();

            if (!correoPropietario.equalsIgnoreCase(correo)) {
                throw new AccessDeniedException(
                        "No puedes modificar una cita de una mascota que no te pertenece");
            }
        }

        // 4. Solo ADMIN o PROPIETARIO pueden modificar
        if (!esAdmin && !esPropietario) {
            throw new AccessDeniedException("No tienes permiso para modificar citas");
        }

        // 5. Solo permitimos modificar una cita PENDIENTE
        if (entity.getEstado() != EstadoCita.PENDIENTE) {
            throw new EstadoCitaInvalidoException("Solo se puede modificar una cita PENDIENTE");
        }

        // 6. Calcular intervalo para comprobar cruce
        LocalDateTime inicioComparacion = request.getFechaCita().minusMinutes(30);

        LocalDateTime finNuevaCita = request.getFechaCita().plusMinutes(30);

        // 7. Buscar cruces, EXCLUYENDO la propia cita
        boolean existeCita =
                citaRepository.existsCitaSuperpuestaExcluyendoCita(
                        entity.getVeterinario().getIdVeterinario(),
                        entity.getIdCita(),
                        inicioComparacion,
                        finNuevaCita
                );

        if (existeCita) {
            throw new CitaHorarioOcupadoException("El veterinario ya tiene una cita que se cruza con ese horario");
        }

        // 8. Actualizar fecha y motivo
        citaMapper.updateEntity(request, entity);

        // 9. Guardar
        CitaEntity updatedEntity = citaRepository.save(entity);

        // 10. Devolver respuesta
        return citaMapper.toResponse(updatedEntity);
    }

    @Override
    @Transactional
    public void delete(Long id) {

        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                );

        if (!esAdmin) {
            throw new AccessDeniedException("Solo el ADMIN puede eliminar físicamente una cita");}

        if (entity.getEstado() == EstadoCita.ATENDIDA) {
            throw new EstadoCitaInvalidoException("No se puede eliminar una cita ATENDIDA");}

        if (entity.getEstado() == EstadoCita.CANCELADA) {
            throw new EstadoCitaInvalidoException("No se puede eliminar una cita CANCELADA");}

        if (entity.getEstado() == EstadoCita.CONFIRMADA) {
            throw new EstadoCitaInvalidoException("No se puede eliminar una cita CONFIRMADA; primero debe cancelarse");}

        citaRepository.delete(entity);
    }

    @Override
    @Transactional
    public CitaResponse confirm(Long id) {

        // 1. Buscar la cita
        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        // 2. Obtener usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String correo = authentication.getName();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                );

        boolean esVeterinario = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_VETERINARIO")
                );

        // 3. Validar quién puede confirmar
        if (esAdmin) {
            // ADMIN puede continuar
        } else if (esVeterinario) {

            String correoVeterinarioAsignado =
                    entity.getVeterinario()
                            .getUsuario()
                            .getCorreo();

            if (!correoVeterinarioAsignado.equalsIgnoreCase(correo)) {
                throw new AccessDeniedException(
                        "No puedes confirmar una cita asignada a otro veterinario");}

        } else {
            throw new AccessDeniedException("No tienes permiso para confirmar citas");
        }

        // 4. Solo una cita PENDIENTE puede confirmarse
        if (entity.getEstado() != EstadoCita.PENDIENTE) {
            throw new EstadoCitaInvalidoException("Solo se puede confirmar una cita PENDIENTE");
        }

        // 5. Cambiar estado
        entity.setEstado(EstadoCita.CONFIRMADA);

        // 6. Guardar y devolver
        return citaMapper.toResponse(
                citaRepository.save(entity));
    }

    @Override
    @Transactional
    public CitaResponse cancel(Long id) {

        // 1. Buscar la cita
        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        // 2. Obtener usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String correo = authentication.getName();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                );

        boolean esPropietario = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_PROPIETARIO")
                );

        // 3. Validar quién puede cancelar
        if (esAdmin) {
            // ADMIN puede continuar
        } else if (esPropietario) {

            String correoPropietario =
                    entity.getMascota()
                            .getPropietario()
                            .getUsuario()
                            .getCorreo();

            if (!correoPropietario.equalsIgnoreCase(correo)) {
                throw new AccessDeniedException("No puedes cancelar una cita que no pertenece a una de tus mascotas");}

        } else {
            throw new AccessDeniedException("No tienes permiso para cancelar citas");
        }

        // 4. Validar estado
        if (entity.getEstado() != EstadoCita.PENDIENTE
                && entity.getEstado() != EstadoCita.CONFIRMADA) {

            throw new EstadoCitaInvalidoException("Solo se puede cancelar una cita PENDIENTE o CONFIRMADA");
        }

        // 5. Cambiar estado
        entity.setEstado(EstadoCita.CANCELADA);

        // 6. Guardar y devolver
        return citaMapper.toResponse(citaRepository.save(entity));
    }


    @Override
    @Transactional
    public CitaResponse attend(Long id) {

        // 1. Buscar la cita
        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Cita no encontrada"));

        // 2. Obtener usuario autenticado
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String correo = authentication.getName();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                );

        boolean esVeterinario = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_VETERINARIO")
                );

        // 3. Validar quién puede marcar como atendida
        if (esAdmin) {
            // ADMIN puede continuar

        } else if (esVeterinario) {

            String correoVeterinario =
                    entity.getVeterinario()
                            .getUsuario()
                            .getCorreo();

            if (!correoVeterinario.equalsIgnoreCase(correo)) {
                throw new AccessDeniedException(
                        "No puedes marcar como atendida una cita asignada a otro veterinario"
                );
            }

        } else {
            throw new AccessDeniedException(
                    "No tienes permiso para marcar citas como atendidas"
            );
        }

        // 4. Validar estado
        if (entity.getEstado() != EstadoCita.CONFIRMADA) {
            throw new EstadoCitaInvalidoException(
                    "Solo se puede marcar como ATENDIDA una cita CONFIRMADA"
            );
        }

        // 5. NUEVA REGLA: validar fecha y hora de la cita
        if (entity.getFechaCita().isAfter(LocalDateTime.now())) {
            throw new EstadoCitaInvalidoException(
                    "No se puede marcar como ATENDIDA una cita cuya fecha y hora aún no han llegado"
            );
        }

        // 6. Cambiar estado
        entity.setEstado(EstadoCita.ATENDIDA);

        // 7. Guardar y devolver
        return citaMapper.toResponse(citaRepository.save(entity));
    }


    private void validarAccesoConsulta(CitaEntity cita) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String correo = authentication.getName();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean esVeterinario = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_VETERINARIO"));

        boolean esPropietario = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PROPIETARIO"));

        // ADMIN puede consultar cualquier cita
        if (esAdmin) {
            return;
        }

        // VETERINARIO solo si la cita está asignada a él
        if (esVeterinario) {
            String correoVeterinario =
                    cita.getVeterinario()
                            .getUsuario()
                            .getCorreo();

            if (correoVeterinario.equalsIgnoreCase(correo)) {
                return;
            }
        }

        // PROPIETARIO solo si la mascota de la cita es suya
        if (esPropietario) {
            String correoPropietario =
                    cita.getMascota()
                            .getPropietario()
                            .getUsuario()
                            .getCorreo();

            if (correoPropietario.equalsIgnoreCase(correo)) {
                return;
            }
        }

        throw new AccessDeniedException("No tienes permiso para consultar esta cita");
    }
}