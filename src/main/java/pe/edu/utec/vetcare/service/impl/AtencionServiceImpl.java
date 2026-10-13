package pe.edu.utec.vetcare.service.impl;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utec.vetcare.dto.request.CreateAtencionRequest;
import pe.edu.utec.vetcare.dto.request.UpdateAtencionRequest;
import pe.edu.utec.vetcare.dto.response.AtencionResponse;
import pe.edu.utec.vetcare.entity.AtencionEntity;
import pe.edu.utec.vetcare.entity.CitaEntity;
import pe.edu.utec.vetcare.entity.HistoriaClinicaEntity;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;
import pe.edu.utec.vetcare.enums.EstadoCita;
import pe.edu.utec.vetcare.exception.AtencionNoEncontradaException;
import pe.edu.utec.vetcare.exception.EstadoCitaInvalidoException;
import pe.edu.utec.vetcare.mapper.AtencionMapper;
import pe.edu.utec.vetcare.repository.AtencionRepository;
import pe.edu.utec.vetcare.repository.CitaRepository;
import pe.edu.utec.vetcare.repository.HistoriaClinicaRepository;
import pe.edu.utec.vetcare.service.AtencionService;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AtencionServiceImpl implements AtencionService {

    private final AtencionRepository atencionRepository;
    private final CitaRepository citaRepository;
    private final HistoriaClinicaRepository historiaClinicaRepository;
    private final AtencionMapper atencionMapper;

    public AtencionServiceImpl(
            AtencionRepository atencionRepository,
            CitaRepository citaRepository,
            HistoriaClinicaRepository historiaClinicaRepository,
            AtencionMapper atencionMapper
    ) {
        this.atencionRepository = atencionRepository;
        this.citaRepository = citaRepository;
        this.historiaClinicaRepository = historiaClinicaRepository;
        this.atencionMapper = atencionMapper;
    }

    // =========================================================
    // LISTAR ATENCIONES
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<AtencionResponse> getAll() {

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

        return atencionRepository.findAll()
                .stream()
                .filter(atencion -> {

                    // ADMIN puede ver todas
                    if (esAdmin) {
                        return true;
                    }

                    // VETERINARIO:
                    // solo atenciones pertenecientes a citas asignadas a él
                    if (esVeterinario) {

                        String correoVeterinario =
                                atencion.getCita()
                                        .getVeterinario()
                                        .getUsuario()
                                        .getCorreo();

                        return correoVeterinario.equalsIgnoreCase(correo);
                    }

                    // PROPIETARIO:
                    // solo atenciones correspondientes a sus mascotas
                    if (esPropietario) {

                        String correoPropietario =
                                atencion.getCita()
                                        .getMascota()
                                        .getPropietario()
                                        .getUsuario()
                                        .getCorreo();

                        return correoPropietario.equalsIgnoreCase(correo);
                    }

                    return false;
                })
                .map(atencionMapper::toResponse)
                .toList();
    }

    // =========================================================
    // BUSCAR ATENCIÓN POR ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public AtencionResponse getById(Long id) {

        AtencionEntity entity = atencionRepository.findById(id)
                .orElseThrow(() ->
                        new AtencionNoEncontradaException(
                                "Atención no encontrada"
                        )
                );

        validarAccesoConsulta(entity);

        return atencionMapper.toResponse(entity);
    }

    // =========================================================
    // CREAR ATENCIÓN
    // =========================================================

    @Override
    @Transactional
    public AtencionResponse create(CreateAtencionRequest request) {

        // 1. Obtener usuario autenticado
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String correo = authentication.getName();

        // 2. Solo VETERINARIO puede registrar una atención
        boolean esVeterinario = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_VETERINARIO")
                );

        if (!esVeterinario) {
            throw new AccessDeniedException(
                    "Solo un VETERINARIO puede registrar una atención"
            );
        }

        // 3. Buscar cita
        CitaEntity cita = citaRepository.findById(request.getIdCita())
                .orElseThrow(() ->
                        new RuntimeException("Cita no encontrada")
                );

        // 4. La cita debe estar ATENDIDA
        if (cita.getEstado() != EstadoCita.ATENDIDA) {
            throw new EstadoCitaInvalidoException(
                    "Solo se puede registrar una atención para una cita ATENDIDA"
            );
        }

        // 5. Obtener el veterinario directamente desde la cita
        VeterinarioEntity veterinario = cita.getVeterinario();

        // 6. Verificar que el veterinario autenticado
        // sea el veterinario asignado a esa cita
        String correoVeterinarioAsignado =
                veterinario.getUsuario().getCorreo();

        if (!correoVeterinarioAsignado.equalsIgnoreCase(correo)) {
            throw new AccessDeniedException(
                    "No puedes registrar una atención para una cita asignada a otro veterinario"
            );
        }

        // 7. Verificar que la cita no tenga ya una atención
        boolean existeAtencion =
                atencionRepository.existsByCita_IdCita(
                        request.getIdCita()
                );

        if (existeAtencion) {
            throw new EstadoCitaInvalidoException(
                    "La cita ya tiene una atención registrada"
            );
        }

        // 8. Buscar historia clínica
        HistoriaClinicaEntity historiaClinica =
                historiaClinicaRepository
                        .findById(request.getIdHistoria())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Historia clínica no encontrada"
                                )
                        );

        // 9. Verificar que la historia clínica
        // corresponda a la misma mascota de la cita
        if (!historiaClinica.getMascota()
                .getIdMascota()
                .equals(
                        cita.getMascota().getIdMascota()
                )) {

            throw new RuntimeException(
                    "La historia clínica no pertenece a la mascota de la cita"
            );
        }

        // 10. Crear entidad
        AtencionEntity entity = new AtencionEntity();

        entity.setHistoriaClinica(historiaClinica);
        entity.setVeterinarioAtencion(veterinario);
        entity.setCita(cita);

        // La fecha la genera el backend
        entity.setFechaAtencion(LocalDateTime.now());

        entity.setPrecioAtencion(
                request.getPrecioAtencion()
        );

        entity.setPeso(
                request.getPeso()
        );

        entity.setSintoma(
                request.getSintoma()
        );

        entity.setDiagnostico(
                request.getDiagnostico()
        );

        entity.setTratamiento(
                request.getTratamiento()
        );

        entity.setObservacion(
                request.getObservacion()
        );

        // 11. Guardar
        AtencionEntity savedEntity =
                atencionRepository.save(entity);

        // 12. Devolver respuesta
        return atencionMapper.toResponse(savedEntity);
    }

    // =========================================================
    // ACTUALIZAR ATENCIÓN
    // =========================================================

    @Override
    @Transactional
    public AtencionResponse update(
            Long id,
            UpdateAtencionRequest request
    ) {

        AtencionEntity entity =
                atencionRepository.findById(id)
                        .orElseThrow(() ->
                                new AtencionNoEncontradaException(
                                        "Atención no encontrada"
                                )
                        );

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

        // Solo ADMIN o VETERINARIO pueden modificar una atención
        if (!esAdmin && !esVeterinario) {
            throw new AccessDeniedException(
                    "No tienes permiso para modificar esta atención"
            );
        }

        // Si es veterinario, solo puede modificar
        // una atención correspondiente a una cita asignada a él
        if (esVeterinario && !esAdmin) {

            String correoVeterinarioAsignado =
                    entity.getCita()
                            .getVeterinario()
                            .getUsuario()
                            .getCorreo();

            if (!correoVeterinarioAsignado.equalsIgnoreCase(correo)) {
                throw new AccessDeniedException(
                        "No puedes modificar una atención perteneciente a otro veterinario"
                );
            }
        }

        atencionMapper.updateEntity(request, entity);

        AtencionEntity updatedEntity =
                atencionRepository.save(entity);

        return atencionMapper.toResponse(updatedEntity);
    }

    // =========================================================
    // ELIMINAR ATENCIÓN
    // =========================================================

    @Override
    @Transactional
    public void delete(Long id) {

        AtencionEntity entity =
                atencionRepository.findById(id)
                        .orElseThrow(() ->
                                new AtencionNoEncontradaException(
                                        "Atención no encontrada"
                                )
                        );

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                );

        if (!esAdmin) {
            throw new AccessDeniedException(
                    "Solo el ADMIN puede eliminar físicamente una atención"
            );
        }

        atencionRepository.delete(entity);
    }

    // =========================================================
    // VALIDAR ACCESO A UNA ATENCIÓN
    // =========================================================

    private void validarAccesoConsulta(
            AtencionEntity atencion
    ) {

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

        boolean esPropietario = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_PROPIETARIO")
                );

        // ADMIN puede consultar cualquier atención
        if (esAdmin) {
            return;
        }

        // VETERINARIO solo puede consultar
        // atenciones de citas asignadas a él
        if (esVeterinario) {

            String correoVeterinario =
                    atencion.getCita()
                            .getVeterinario()
                            .getUsuario()
                            .getCorreo();

            if (correoVeterinario.equalsIgnoreCase(correo)) {
                return;
            }
        }

        // PROPIETARIO solo puede consultar
        // atenciones de sus propias mascotas
        if (esPropietario) {

            String correoPropietario =
                    atencion.getCita()
                            .getMascota()
                            .getPropietario()
                            .getUsuario()
                            .getCorreo();

            if (correoPropietario.equalsIgnoreCase(correo)) {
                return;
            }
        }

        throw new AccessDeniedException(
                "No tienes permiso para consultar esta atención"
        );
    }
}